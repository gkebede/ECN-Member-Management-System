import {
  Box, Button, Card, CardActions, CardContent, CardHeader,
  Chip,  Grid,  Table, TableBody, TableCell,
  TableHead, TableRow, Typography, Collapse, IconButton
} from "@mui/material";
import { Delete as DeleteIcon, ExpandMore, ExpandLess } from "@mui/icons-material";
import { useNavigate, Link as RouterLink } from "react-router-dom";
//import { Member } from "../../../lib/types";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import type { Member } from "../../../lib/types";
import { useStore } from "../../../stores/store";

//import { useStore } from "../../../app/stores/store";

type Props = {
  member: Member;
  onDeleteClick?: () => void;
};

export default function MemberCard({ member, onDeleteClick }: Props) {
  const navigate = useNavigate();
  const store = useStore();
  const { memberStore } = store;
  const { loadMember, setEditMode } = memberStore;
  
  // State for expand/collapse
  const [showFamilyMembers, setShowFamilyMembers] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);

  useEffect(() => {
    if (member?.id) {
      setEditMode(true);
      loadMember(member.id);
    } else {
      setEditMode(false);
    }
  }, [member?.id, loadMember, setEditMode]);

  const navigateList = () => navigate('/memberList');

  const handleDetailsClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const memberId = event.currentTarget.getAttribute('data-member-id');
    if (memberId) {
      navigate(`/edit/${memberId}`);
    }
  };

  const formatSafeDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const d = new Date(dateString);
    return !isNaN(d.getTime()) ? format(d, 'dd MMM yyyy') : 'N/A';
  };

  const formatCurrency = (amount?: number) => {
    if (amount == null) return 'N/A';
    return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  };

  return (
    <Grid container justifyContent="center" mt={10}>
      <Grid>
        <Card sx={{ borderRadius: 3, backgroundColor: '#f5f5f5' }}>
          <CardHeader
            title={
              <Typography variant="h4" sx={{ textTransform: 'uppercase' }}>
                {member.firstName} {member.lastName}
              </Typography>
            }
            sx={{
              backgroundColor: '#006663',
              color: 'white',
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
            }}
          />

          <CardContent>
            <Typography mb={2} variant="h6"><strong>Email:</strong> {member.email}</Typography>
            <Typography mb={2} variant="h6"><strong>Phone:</strong> {member.phoneNumber}</Typography>

            {member.bio && (
              <Chip
                label={member.bio}
                variant="outlined"
                sx={{
                  mt: 3,
                  backgroundColor: 'black',
                  padding: 2.5,
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'white',
                  wordBreak: 'break-word',
                }}
              />
            )}

            {/* Family Members and Payment Details Side by Side */}
            <Box mt={4}>
              <Grid container spacing={3}>
                {/* Family Members Section */}
                {member.familyMembers && member.familyMembers.length > 0 && (
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#006663' }}>
                        Family Members ({member.familyMembers.length})
                      </Typography>
                      <IconButton
                        onClick={() => setShowFamilyMembers(!showFamilyMembers)}
                        sx={{ color: '#006663' }}
                      >
                        {showFamilyMembers ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </Box>
                    <Collapse in={showFamilyMembers}>
                      <Table size="small" sx={{ backgroundColor: 'white', borderRadius: 1 }}>
                        <TableHead>
                          <TableRow>
                            <TableCell><strong>First Name</strong></TableCell>
                            <TableCell><strong>Middle Name</strong></TableCell>
                            <TableCell><strong>Last Name</strong></TableCell>
                            <TableCell><strong>Relationship</strong></TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {member.familyMembers.map((fm, idx) => (
                            <TableRow key={fm.id || idx}>
                              <TableCell>{fm.memberFamilyFirstName || 'N/A'}</TableCell>
                              <TableCell>{fm.memberFamilyMiddleName || 'N/A'}</TableCell>
                              <TableCell>{fm.memberFamilyLastName || 'N/A'}</TableCell>
                              <TableCell>
                                <Chip
                                  label={fm.relationship || 'N/A'}
                                  size="small"
                                  sx={{
                                    backgroundColor: '#006663',
                                    color: 'white',
                                    fontWeight: 'bold',
                                  }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Collapse>
                  </Grid>
                )}

                {/* Payment Details Section */}
                <Grid size={{ xs: 12, md: member.familyMembers && member.familyMembers.length > 0 ? 6 : 12 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#006663' }}>
                      Payment Details {member.payments && member.payments.length > 0 && `(${member.payments.length})`}
                    </Typography>
                    <IconButton
                      onClick={() => setShowPaymentDetails(!showPaymentDetails)}
                      sx={{ color: '#006663' }}
                    >
                      {showPaymentDetails ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Box>
                  <Collapse in={showPaymentDetails}>
                    <Table size="small" sx={{ backgroundColor: 'white', borderRadius: 1 }}>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Number of Event</strong></TableCell>
                    <TableCell><strong>Payment Amount</strong></TableCell>
                    <TableCell><strong>Date of Payment</strong></TableCell>
                    <TableCell><strong>Payment Slips</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {member.payments && member.payments.length > 0 ? (
                    member.payments.map((pmt, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          {member.incidents && member.incidents[idx] 
                            ? member.incidents[idx].eventNumber 
                            : member.incidents && member.incidents.length > 0
                            ? member.incidents[0].eventNumber
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          {formatCurrency(pmt.paymentAmount)}
                        </TableCell>
                        <TableCell>
                          {formatSafeDate(pmt.paymentDate)}
                        </TableCell>
                        <TableCell>
                          {(() => {
                            // Filter files to only show those with valid base64FileData
                            const validFiles = member.memberFiles?.filter(
                              file => file.base64FileData && file.base64FileData.trim() !== ''
                            ) || [];
                            
                            if (validFiles.length === 0) {
                              return "N/A";
                            }
                            
                            return validFiles.map((file, fileIdx) => (
                              <div key={fileIdx} style={{ marginBottom: "5px" }}>
                                <RouterLink
                                  to={`/memberList/recipts/${file.id}`}
                                  style={{
                                    textDecoration: "none",
                                    color: "#007bff",
                                    cursor: "pointer",
                                  }}
                                >
                                  {file.fileName || "Receipt"}
                                </RouterLink>
                              </div>
                            ));
                          })()}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography color="text.secondary">No payment information available</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
                    </Table>
                  </Collapse>
                </Grid>
              </Grid>
            </Box>
          </CardContent>

          <CardActions sx={{ justifyContent: 'flex-end', p: 2, gap: 1 }}>
            <Button onClick={navigateList} color="inherit">Cancel</Button>
            {onDeleteClick && (
              <Button
                variant="contained"
                color="error"
                startIcon={<DeleteIcon />}
                onClick={onDeleteClick}
                sx={{
                  fontWeight: 'bold',
                  '&:hover': {
                    backgroundColor: '#d32f2f',
                  },
                }}
              >
                Delete
              </Button>
            )}
            <Button variant="contained" color="primary" onClick={handleDetailsClick} data-member-id={member.id}>
              Update
            </Button>
          </CardActions>
        </Card>
      </Grid>
      {/* <SideDrawer /> */}
    </Grid>
  );
}
