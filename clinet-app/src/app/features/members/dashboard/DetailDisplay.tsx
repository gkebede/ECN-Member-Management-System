import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Typography,
} from '@mui/material';
import { Delete as DeleteIcon, Warning as WarningIcon } from '@mui/icons-material';
import MemberCard from './MemberCard';
import { useStore } from '../../../stores/store';

const DetailDisplay = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { memberStore } = useStore();
  const [openDialog, setOpenDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Load full member details with all related data
  React.useEffect(() => {
    if (id) {
      memberStore.loadMember(id);
    }
  }, [id, memberStore]);
  
  // Use selectedMember if available (has full details), otherwise fall back to members list
  const member = memberStore.selectedMember?.id === id 
    ? memberStore.selectedMember 
    : memberStore.members.find(m => m.id === id);

  const handleDeleteClick = () => {
    setOpenDialog(true);
  };

  const handleDialogClose = () => {
    if (!isDeleting) {
      setOpenDialog(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!id || !member) return;

    setIsDeleting(true);
    try {
      await memberStore.deleteMember(id);
      setOpenDialog(false);
      navigate('/memberList');
    } catch (error) {
      console.error('Error deleting member:', error);
      setIsDeleting(false);
      // Keep dialog open on error so user can try again or cancel
    }
  };

  if (!memberStore.members) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading...</Typography>
      </Box>
    );
  }

  if (!member) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading member...</Typography>
      </Box>
    );
  }

  return (
    <>
      <MemberCard member={member} onDeleteClick={handleDeleteClick} />

      {/* Confirmation Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleDialogClose}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          id="delete-dialog-title"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: '#d32f2f',
            fontWeight: 'bold',
          }}
        >
          <WarningIcon sx={{ fontSize: '2rem' }} />
          Confirm Delete Member
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description" sx={{ fontSize: '1rem', lineHeight: 1.8 }}>
            Are you sure you want to delete{' '}
            <strong>
              {member.firstName} {member.middleName} {member.lastName}
            </strong>
            ?
            <br />
            <br />
            This action <strong>cannot be undone</strong>. All associated data including addresses, family members,
            payments, incidents, and files will be permanently deleted.
            <br />
            <br />
            <strong>This member will be permanently removed from the system.</strong>
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={handleDialogClose}
            disabled={isDeleting}
            variant="outlined"
            sx={{ minWidth: 100 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            disabled={isDeleting}
            variant="contained"
            color="error"
            startIcon={isDeleting ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
            sx={{ minWidth: 100 }}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const ObservedDetailDisplay = observer(DetailDisplay);
export default ObservedDetailDisplay;
 






 