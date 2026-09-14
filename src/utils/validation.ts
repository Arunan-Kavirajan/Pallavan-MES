import { calculateRejectionPercentage } from './calculations';

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface FormValues {
  plannedQuantity: number | string;
  producedQuantity: number | string;
  rejectedQuantity: number | string;
  rejectionReason: string;
  downtimeMinutes: number | string;
  downtimeReason: string;
  remarks: string;
}

export function validateEntryForm(values: FormValues, isSubmit: boolean = false): ValidationResult {
  const errors: Record<string, string> = {};

  const planned = Number(values.plannedQuantity);
  const produced = Number(values.producedQuantity);
  const rejected = Number(values.rejectedQuantity);
  const downtime = Number(values.downtimeMinutes);

  // 1. Whole numbers and non-negative
  if (planned < 0 || !Number.isInteger(planned)) errors.plannedQuantity = 'Must be a non-negative whole number';
  if (produced < 0 || !Number.isInteger(produced)) errors.producedQuantity = 'Must be a non-negative whole number';
  if (rejected < 0 || !Number.isInteger(rejected)) errors.rejectedQuantity = 'Must be a non-negative whole number';
  if (downtime < 0 || !Number.isInteger(downtime)) errors.downtimeMinutes = 'Must be a non-negative whole number';

  // 2. Downtime limits
  if (downtime > 60) errors.downtimeMinutes = 'Downtime cannot exceed 60 minutes';

  // 3. Rejected cannot exceed produced
  if (rejected > produced) errors.rejectedQuantity = 'Rejected quantity cannot exceed produced quantity';

  // 4. Conditional Rejection Reason
  if (rejected > 0 && !values.rejectionReason) {
    errors.rejectionReason = 'Rejection reason is mandatory when rejected quantity is > 0';
  }

  // 5. Conditional Downtime Reason
  if (downtime > 0 && !values.downtimeReason) {
    errors.downtimeReason = 'Downtime reason is mandatory when downtime > 0';
  }

  // 6. 10% Rejection rule (Required on Submit, or as warning on Draft)
  if (isSubmit) {
    const rejectionRate = calculateRejectionPercentage(produced, rejected);
    if (rejectionRate > 10.0 && (!values.remarks || values.remarks.trim() === '')) {
      errors.remarks = `Rejection rate is ${rejectionRate}%. A remark is mandatory before submitting.`;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
