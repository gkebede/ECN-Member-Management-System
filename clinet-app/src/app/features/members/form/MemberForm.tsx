import {
  Box, Button, Checkbox, CircularProgress,
  Container, FormControl, FormControlLabel, InputLabel, MenuItem, Paper,
  TextField, Typography
} from '@mui/material';
import Select from '@mui/material/Select';
import type { SelectChangeEvent } from '@mui/material/Select';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { observer } from 'mobx-react-lite';

import agent from '../../../lib/api/agent';
 

import AddressFormSection from './AddressFormSection';
import FamilyMemberFormSection from './FamilyMemberFormSection';
import PaymentFormSection from './PaymentFormSection';
import IncidentFormSection from './IncidentFormSection';
import type { Member, Address, FamilyMember, Payment,
   Incident, MemberFile, } from '../../../lib/types';
import { useStore } from '../../../stores/store';

const defaultMember: Member = {
  id: '',
  firstName: '',
  middleName: '',
  lastName: '',
  email: '',
  registerDate: '',
  phoneNumber: '',
  isActive: true, // New members are active by default
  isAdmin: false,
  userName: '',
  password: '',
  addresses: [],
  familyMembers: [],
  payments: [],
  incidents: [],
  memberFiles: [],
};

const formatCurrencyValue = (amount?: number) => {
  if (amount == null || isNaN(amount)) return 'N/A';
  return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
};

function MemberForm() {
  const { memberStore } = useStore();
  const { selectedMember, editMode, setEditMode, loadMember } = memberStore;
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [member, setMember] = useState<Member>(defaultMember);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [memberFiles, setMemberFiles] = useState<MemberFile[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>('');
  const [fileDescription, setFileDescription] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(member.email);
  // In edit mode, show all sections even if middleName is empty
  // For new members, require all base fields including middleName
  const isBaseInfoFilled = editMode 
    ? !!(
        member.firstName && 
        member.lastName && 
        isEmailValid && 
        member.phoneNumber &&
        (!member.isAdmin || (member.isAdmin && member.userName && (editMode || member.password)))
      )
    : !!(
        member.firstName && 
        member.middleName && 
        member.lastName && 
        isEmailValid && 
        member.phoneNumber &&
        (!member.isAdmin || (member.isAdmin && member.userName && (editMode || member.password)))
      );

  useEffect(() => {
    if (id) {
      setEditMode(true);
      loadMember(id);
    } else {
      setEditMode(false);
      resetForm();
    }
  }, [id, loadMember, setEditMode]);

  useEffect(() => {
    if (editMode && selectedMember && selectedMember.id === id) {
      // const formattedDate = selectedMember.registerDate
      //   ? new Date(selectedMember.registerDate).toISOString().split('T')[0]
      //   : '';
  const formattedDate = (() => {
  const d = new Date(selectedMember.registerDate || '');
  return !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : '';
})();


      // Ensure all fields are set, even if empty (especially middleName)
      setMember({ 
        ...selectedMember, 
        registerDate: formattedDate,
        middleName: selectedMember.middleName || '', // Ensure middleName is at least empty string
        firstName: selectedMember.firstName || '',
        lastName: selectedMember.lastName || '',
        email: selectedMember.email || '',
        phoneNumber: selectedMember.phoneNumber || '',
      });
      setAddresses(selectedMember.addresses ?? []);
      setFamilyMembers(selectedMember.familyMembers ?? []);
      
      // Log payments for debugging
      setPayments(selectedMember.payments ?? []);
      setIncidents(selectedMember.incidents ?? []);
      setMemberFiles(selectedMember.memberFiles ?? []);
    } else {
      resetForm();
    }
  }, [editMode, selectedMember, id]);

  const resetForm = () => {
    setMember(defaultMember);
    setAddresses([]);
    setFamilyMembers([]);
    setPayments([]);
    setIncidents([]);
    setMemberFiles([]);
    setFiles([]);
    setSelectedPaymentId('');
    setFileDescription('');
  };

  const handleInputChange = (
    key: keyof Member,
    value: string | boolean
  ) => {
    setMember(prev => ({ ...prev, [key]: value }));
  };

  const handleCancel = () => {
    resetForm();
    navigate('/memberList');
  };

const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();

  const updatedMember: Member = {
    ...member,
    addresses,
    familyMembers,
    payments,
    incidents,
    memberFiles
  };

  try {
    let memberId = member.id;

    if (editMode) {
      // Log the data being sent for debugging
      await agent.Members.update(updatedMember);
      
      // Reload member details to get updated memberFiles (including newly uploaded ones)
      if (member.id) {
        try {
          const refreshed = await agent.Members.details(member.id);
          if (refreshed && refreshed.value) {
            setMemberFiles(refreshed.value.memberFiles ?? []);
            console.log("MemberFiles refreshed after update:", refreshed.value.memberFiles?.length ?? 0);
          }
        } catch (error) {
          console.error("Error refreshing member details:", error);
        }
      }
      
      // Reload member list after update
      await memberStore.loadAllMembers();
      navigate('/memberList');
    } else {
      //  Use the FormData version for creating
      try {
        const result = await agent.Members.create(updatedMember, files);

        // HandleResult returns Ok(result.Value), so the response is just the string ID
        // Check if result is a string (member ID) or Result object (for backward compatibility)
        if (typeof result === 'string') {
          // Direct string response (member ID) - this is the expected format
          memberId = result;
        } else if (result && typeof result === 'object') {
          // Result object format (for backward compatibility)
          if ('isSuccess' in result && result.isSuccess === false) {
            const errorMsg = ('error' in result ? result.error : 'Unknown error') || "Failed to create member";
            console.error("Failed to create member:", errorMsg);
            alert(`Error: ${errorMsg}`);
            return;
          }
          // Try to extract value from Result object
          if ('value' in result && typeof result.value === 'string') {
            memberId = result.value;
          } else {
            console.error("Unexpected response format - no 'value' property or value is not a string:", result);
            alert("Error: Unexpected response format from server");
            return;
          }
        } else {
          console.error("Unexpected response format:", result);
          alert("Error: Unexpected response format from server");
          return;
        }
        
        if (!memberId || memberId.trim() === '') {
          console.error("No member ID returned from API");
          alert("Error: No member ID returned from server");
          return;
        }

        // Navigate to member list after successful creation
        navigate('/memberList');
        
        // Reload member list to show the newly created member (in background)
        // Use setTimeout to ensure navigation happens first
        setTimeout(async () => {
          try {
            await memberStore.loadAllMembers();
          } catch (loadError) {
            console.error("Error reloading member list:", loadError);
            // Navigation already happened, so continue
          }
        }, 100);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const axiosError = error as { response?: { data?: string | { error?: string; errors?: Record<string, unknown> } } };
        const responseData = axiosError?.response?.data;
        
        let errorMsg = errorMessage;
        if (typeof responseData === 'string') {
          errorMsg = responseData;
        } else if (responseData && typeof responseData === 'object') {
          if ('error' in responseData) {
            errorMsg = responseData.error as string;
          } else if ('errors' in responseData) {
            errorMsg = JSON.stringify(responseData.errors);
          }
        }
        
        alert(`Error creating member: ${errorMsg}`);
        // Don't navigate on error - let user fix and try again
      }
    }

    // Upload files (only for edit mode or extra uploads)
    if (files.length > 0 && memberId) {
      // File upload functionality can be implemented here if needed
      // await agent.uploads(memberId, files, "Uploaded during member form submission");
      // const refreshed = await agent.Members.details(memberId);
      // setMemberFiles(refreshed.memberFiles ?? []);
    }
  } catch (error) {
    console.error(`Error ${editMode ? 'updating' : 'creating'} member:`, error);
  }
};


  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (fileList) {
      setFiles(prev => [...prev, ...Array.from(fileList)]);
    }
  };

  useEffect(() => {
    if (selectedPaymentId && !payments.some(p => p.id === selectedPaymentId)) {
      setSelectedPaymentId('');
    }
  }, [payments, selectedPaymentId]);

  const handleUpload = async () => {
    if (!files.length || !member.id) return;

    try {
      await agent.Members.uploadFiles(
        member.id,
        files,
        fileDescription || undefined,
        selectedPaymentId || undefined
      );
      
      // Reload member details to get updated memberFiles
      const refreshed = await agent.Members.details(member.id);
      if (refreshed && refreshed.value) {
        setMemberFiles(refreshed.value.memberFiles ?? []);
      }
      
      // Clear the file input
      setFiles([]);
      setSelectedPaymentId('');
      setFileDescription('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error("Upload failed:", error);
    }
  };

  const handlePaymentSelection = (event: SelectChangeEvent<string>) => {
    setSelectedPaymentId(event.target.value);
  };

  // Individual save handlers for each section
  const handleSaveAddresses = async (updatedAddresses: Address[]) => {
    if (!member.id) return;
    const updatedMember = { ...member, addresses: updatedAddresses };
    await agent.Members.update(updatedMember);
    // Reload member to get latest data
    const refreshed = await agent.Members.details(member.id);
    if (refreshed && refreshed.value) {
      setAddresses(refreshed.value.addresses ?? []);
    }
  };

  const handleSaveFamilyMembers = async (updatedFamilyMembers: FamilyMember[]) => {
    if (!member.id) return;
    const updatedMember = { ...member, familyMembers: updatedFamilyMembers };
    await agent.Members.update(updatedMember);
    // Reload member to get latest data
    const refreshed = await agent.Members.details(member.id);
    if (refreshed && refreshed.value) {
      setFamilyMembers(refreshed.value.familyMembers ?? []);
    }
  };

  const handleSavePayments = async (updatedPayments: Payment[]) => {
    if (!member.id) return;
    const updatedMember = { ...member, payments: updatedPayments };
    await agent.Members.update(updatedMember);
    // Reload member to get latest data - use store's loadMember to ensure proper normalization
    await loadMember(member.id);
    // Update local state from the store's selectedMember (which is now normalized)
    if (memberStore.selectedMember) {
      const refreshedPayments = memberStore.selectedMember.payments ?? [];
      setPayments(refreshedPayments);
      setMember(prev => ({
        ...prev,
        payments: refreshedPayments,
      }));
    }
  };

  const handleSaveIncidents = async (updatedIncidents: Incident[]) => {
    if (!member.id) return;
    const updatedMember = { ...member, incidents: updatedIncidents };
    await agent.Members.update(updatedMember);
    // Reload member to get latest data
    const refreshed = await agent.Members.details(member.id);
    if (refreshed && refreshed.value) {
      setIncidents(refreshed.value.incidents ?? []);
    }
  };

  if (editMode && (!selectedMember || selectedMember.id !== id)) {
    return (
      <Box sx={{ mt: 22, display: 'flex', justifyContent: 'center', alignItems: 'center', height: '15vh' }}>
        <CircularProgress style={{ color: 'green', width: 100, height: 100 }} />
        <Box sx={{ fontSize: '2rem', ml: 2, fontWeight: 700 }}>Loading Member...</Box>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ backgroundColor: '#f5f5f5', padding: '.1px', pb: 4 }}>
      <Box component="form" onSubmit={handleSubmit}>
        <Paper elevation={3} sx={{ p: 3, mb: 2, borderRadius: 3 }}>
          <Typography variant="h4" gutterBottom color="primary">
            {editMode ? 'Edit Member' : 'Register New Member'}
          </Typography>

            <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2}>
            <TextField 
              label="First Name" 
              value={member.firstName || ''}
              onChange={(e) => handleInputChange('firstName', e.target.value)} 
              required
            />

            <TextField 
              label="Middle Name" 
              value={member.middleName || ''}
              onChange={(e) => handleInputChange('middleName', e.target.value)}
              required={!editMode}
              helperText={editMode ? "Optional" : ""}
            />

            <TextField 
              label="Last Name" 
              value={member.lastName || ''}
              onChange={(e) => handleInputChange('lastName', e.target.value)} 
              required
            />

            <TextField
  label="Email"
  value={member.email ?? ''}
  onChange={(e) => setMember(prev => ({ ...prev, email: e.target.value }))}
  required
/>


            <TextField label="Phone Number" value={member.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)} />

            <TextField
              label="Register Date"
              type="date"
              value={member.registerDate || ''}
              onChange={(e) => setMember(prev => ({ ...prev, registerDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
            />

            <FormControlLabel control={
              <Checkbox checked={member.isActive}
              onChange={(e) => setMember(prev => ({ ...prev, isActive: e.target.checked }))} />
            } label="Is Active" />

            <FormControlLabel control={
              <Checkbox checked={member.isAdmin}
              onChange={(e) => setMember(prev => ({ ...prev, isAdmin: e.target.checked }))} />
            } label="Is Admin" />

            </Box>

            {/* Username and Password fields - only show when Is Admin is checked */}
            {member.isAdmin && (
              <Box sx={{ mt: 3, p: 2, backgroundColor: 'rgba(24, 42, 115, 0.05)', borderRadius: 2, border: '1px solid rgba(24, 42, 115, 0.2)' }}>
                <Typography variant="h6" sx={{ mb: 2, color: '#182a73', fontWeight: 'bold' }}>
                  Admin Credentials
                </Typography>
                <Box display="grid" gridTemplateColumns="repeat(2, 1fr)" gap={2}>
                  <TextField
                    label="Username"
                    value={member.userName || ''}
                    onChange={(e) => setMember(prev => ({ ...prev, userName: e.target.value }))}
                    required={member.isAdmin}
                    helperText={member.isAdmin && !member.userName ? "Username is required for admin members" : ""}
                    fullWidth
                  />
                  <TextField
                    label="Password"
                    type="password"
                    value={member.password || ''}
                    onChange={(e) => setMember(prev => ({ ...prev, password: e.target.value }))}
                    required={member.isAdmin && !editMode}
                    helperText={
                      member.isAdmin && !editMode && !member.password 
                        ? "Password is required for new admin members" 
                        : editMode 
                        ? "Leave blank to keep current password" 
                        : ""
                    }
                    fullWidth
                  />
                </Box>
              </Box>
            )}

          {isBaseInfoFilled && (
            <>
              <AddressFormSection 
                addresses={addresses} 
                setAddresses={setAddresses}
                memberId={member.id}
                onSave={editMode ? handleSaveAddresses : undefined}
              />
              <FamilyMemberFormSection 
                familymembers={familyMembers} 
                setFamilyMembers={setFamilyMembers}
                memberId={member.id}
                onSave={editMode ? handleSaveFamilyMembers : undefined}
              />
              <PaymentFormSection 
                payments={payments} 
                setPayments={setPayments}
                memberId={member.id}
                onSave={editMode ? handleSavePayments : undefined}
              />
              <IncidentFormSection 
                incidents={incidents} 
                setIncidents={setIncidents}
                memberId={member.id}
                onSave={editMode ? handleSaveIncidents : undefined}
              />

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".png,.jpg,.jpeg,.pdf"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              {editMode && payments.length > 0 && (
                <FormControl sx={{ mt: 2, minWidth: 280 }}>
                  <InputLabel id="attach-payment-label">Attach Receipt To</InputLabel>
                  <Select
                    labelId="attach-payment-label"
                    value={selectedPaymentId}
                    label="Attach Receipt To"
                    onChange={handlePaymentSelection}
                  >
                    <MenuItem value="">
                      No specific payment
                    </MenuItem>
                    {payments.map((pmt, index) => (
                      <MenuItem value={pmt.id || ''} key={pmt.id || index}>
                        {`Payment ${index + 1} - ${formatCurrencyValue(
                          typeof pmt.paymentAmount === 'number'
                            ? pmt.paymentAmount
                            : Number(pmt.paymentAmount)
                        )} (${pmt.paymentDate || 'No date'})`}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <Box mt={2}>
                <TextField
                  label="Receipt description"
                  value={fileDescription}
                  onChange={(e) => setFileDescription(e.target.value)}
                  fullWidth
                  placeholder="e.g., February dues receipt"
                  sx={{ mb: 2 }}
                />
                <Button variant="contained" onClick={() => fileInputRef.current?.click()}>
                  Select Files
                </Button>
              </Box>

              {files.length > 0 && (
                <Box mt={2}>
                  <Typography variant="subtitle1">Selected Files:</Typography>
                  {files.map((file, index) => (
                    <Typography key={index} variant="body2">{file.name}</Typography>
                  ))}
                </Box>
              )}

              <Box mt={2}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleUpload}
                  disabled={files.length === 0 || !member.id}
                >
                  Upload Selected Files
                </Button>
              </Box>
            </>
          )}

          <Box display="flex" justifyContent="flex-end" gap={2} mt={4}>
            <Button onClick={handleCancel} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" color="primary" disabled={!isBaseInfoFilled}>
              {editMode ? 'Update Member' : 'Create Member'}
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

const ObservedMemberForm = observer(MemberForm);
export default ObservedMemberForm;
