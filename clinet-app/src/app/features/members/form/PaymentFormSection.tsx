import {
  Box,
  TextField,
  Button,
  IconButton,
  Typography,
  Paper,
  MenuItem,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  InputAdornment,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import WarningIcon from '@mui/icons-material/Warning';
import type { Payment } from '../../../lib/types';
import { v4 as uuidv4 } from 'uuid';
import { useCallback, useState } from 'react';
import React from 'react';
//import { Payment } from '../../../lib/types';

const paymentMethods: string[] = [
  'cash',
  'creditCard',
  'check',
  'receiptAttached',
  'bankTransfer',
];

const paymentRecurringTypes: string[] = [
  'annual',
  'monthly',
  'quarterly',
  'incident',
  'membership',
  'miscellaneous',
];

type Props = {
  payments: Payment[];
  setPayments: React.Dispatch<React.SetStateAction<Payment[]>>;
  memberId?: string;
  onSave?: (payments: Payment[]) => Promise<void>;
};

export default function PaymentFormSection({ payments, setPayments, memberId, onSave }: Props) {
  const [saving, setSaving] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState<number | null>(null);

  const handleChange = useCallback((
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setPayments(prev => {
      const updated = [...prev];
      const payment = { ...updated[index] };

      switch (name) {
        case 'paymentAmount': {
          // Parse the value and keep as number internally
          const numValue = value === '' ? 0 : parseFloat(value.replace(/[^0-9.-]+/g, ''));
          payment.paymentAmount = isNaN(numValue) ? 0 : numValue;
          break;
        }
        case 'paymentType':
          payment.paymentType = value;
          break;
        case 'paymentRecurringType':
          payment.paymentRecurringType = value;
          break;
        case 'paymentDate':
          payment.paymentDate = value;
          break;
      }

      updated[index] = payment;
      return updated;
    });
  }, [setPayments]);

  const handleAdd = () => {
    setPayments([
      ...payments,
      {
        id: uuidv4(),
        paymentAmount: 0,
        paymentDate: '',
        paymentType: '',
        paymentRecurringType: '',
      },
    ]);
  };

  const handleRemoveClick = (index: number) => {
    setDeleteIndex(index);
    setDeleteDialogOpen(true);
  };

  const handleRemoveConfirm = () => {
    if (deleteIndex !== null) {
      const updated = [...payments];
      updated.splice(deleteIndex, 1);
      setPayments(updated);
      setDeleteDialogOpen(false);
      setDeleteIndex(null);
    }
  };

  const handleRemoveCancel = () => {
    setDeleteDialogOpen(false);
    setDeleteIndex(null);
  };

  const handleSave = async () => {
    if (!memberId || !onSave) return;
    setSaving(true);
    try {
      await onSave(payments);
    } catch (error) {
      console.error('Failed to save payments:', error);
    } finally {
      setSaving(false);
    }
  };

  // const formatCurrency = (amount: number | undefined) => {
  //   if (amount == null || isNaN(amount)) {
  //     return '$0.00';
  //   }
  //   return amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
  // };

  // Debug: Log payments to see what we're receiving
  React.useEffect(() => {
    if (payments && payments.length > 0) {
      console.log('PaymentFormSection - Payments:', payments);
      payments.forEach((p, idx) => {
        const amount = p.paymentAmount;
        const displayValue = (() => {
          if (amount == null || amount === undefined) return '';
          const numValue = typeof amount === 'number' ? amount : parseFloat(String(amount));
          return isNaN(numValue) ? '' : numValue;
        })();
        console.log(`Payment ${idx}:`, {
          id: p.id,
          paymentAmount: p.paymentAmount,
          paymentAmountType: typeof p.paymentAmount,
          displayValue: displayValue,
          displayValueType: typeof displayValue,
          paymentDate: p.paymentDate,
          paymentType: p.paymentType,
          paymentRecurringType: p.paymentRecurringType,
        });
      });
    }
  }, [payments]);

  return (
    <Paper elevation={3} sx={{ padding: 2, marginTop: 2 }}>
      <Box mt={2}>
        <Typography variant="h6">Payments</Typography>
        {payments.map((payment, index) => (
          <Box
            key={payment.id}
            display="grid"
            gridTemplateColumns="1fr 1fr 2fr 2fr auto"
            gap={2}
            alignItems="center"
            mt={2}
          >
            {/* Payment Date */}
            <TextField
              label="Date"
              type="date"
              name="paymentDate"
              value={payment.paymentDate || ''}
              onChange={(e) => handleChange(index, e)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />

            {/* Payment Amount */}
            <TextField
              label="Amount"
              name="paymentAmount"
              type="number"
              value={
                (() => {
                  const amount = payment.paymentAmount;
                  console.log(`PaymentFormSection - Rendering payment ${index} (${payment.id}): paymentAmount=${amount}, type=${typeof amount}`);
                  if (amount == null || amount === undefined) {
                    console.log(`  -> Amount is null/undefined, returning empty string`);
                    return '';
                  }
                  const numValue = typeof amount === 'number' ? amount : parseFloat(String(amount));
                  if (isNaN(numValue)) {
                    console.log(`  -> Parsed value is NaN, returning empty string`);
                    return '';
                  }
                  console.log(`  -> Returning numValue: ${numValue}`);
                  return numValue;
                })()
              }
              onChange={(e) => handleChange(index, e)}
              inputProps={{ min: 0, step: 0.01 }}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>
              }}
              fullWidth
            />

            {/* Payment Type */}
            <TextField
              select
              label="Payment Type"
              name="paymentType"
              value={payment.paymentType || ''}
              onChange={(e) => handleChange(index, e)}
              fullWidth
            >
              {paymentMethods.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>

            {/* Recurring Type */}
            <TextField
              select
              label="Recurring Type"
              name="paymentRecurringType"
              value={payment.paymentRecurringType || ''}
              onChange={(e) => handleChange(index, e)}
              fullWidth
            >
              {paymentRecurringTypes.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>

            {/* Delete Button */}
            <IconButton onClick={() => handleRemoveClick(index)} color="error">
              <DeleteIcon />
            </IconButton>
          </Box>
        ))}

        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button
            onClick={handleAdd}
            variant="outlined"
            color="primary"
          >
            Add Payment
          </Button>
          {memberId && onSave && (
            <Button 
              onClick={handleSave} 
              variant="contained" 
              color="primary"
              startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Payments'}
            </Button>
          )}
        </Box>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleRemoveCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#d32f2f' }}>
          <WarningIcon />
          Confirm Delete Payment
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this payment record?
            <br />
            <br />
            <strong>Important:</strong> After deleting, remember to click the <strong>"Save Payments"</strong> button to save your changes, and then click the <strong>"Update"</strong> button to finalize the update.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRemoveCancel} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleRemoveConfirm} color="error" variant="contained" startIcon={<DeleteIcon />}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
