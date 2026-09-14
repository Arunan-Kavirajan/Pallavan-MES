import { describe, it, expect } from 'vitest';
import { validateEntryForm, FormValues } from '../src/utils/validation';

describe('Validation Engine', () => {
  
  const validBase: FormValues = {
    plannedQuantity: 100,
    producedQuantity: 100,
    rejectedQuantity: 0,
    rejectionReason: '',
    downtimeMinutes: 0,
    downtimeReason: '',
    remarks: ''
  };

  it('passes valid base form', () => {
    const res = validateEntryForm(validBase);
    expect(res.isValid).toBe(true);
  });

  it('rejects negative numbers', () => {
    const res = validateEntryForm({ ...validBase, producedQuantity: -5 });
    expect(res.isValid).toBe(false);
    expect(res.errors.producedQuantity).toBeDefined();
  });

  it('rejects decimals (must be whole numbers)', () => {
    const res = validateEntryForm({ ...validBase, producedQuantity: 10.5 });
    expect(res.isValid).toBe(false);
    expect(res.errors.producedQuantity).toBeDefined();
  });

  it('rejects downtime > 60', () => {
    const res = validateEntryForm({ ...validBase, downtimeMinutes: 65 });
    expect(res.isValid).toBe(false);
    expect(res.errors.downtimeMinutes).toBeDefined();
  });

  it('rejects rejected > produced', () => {
    const res = validateEntryForm({ ...validBase, producedQuantity: 10, rejectedQuantity: 15 });
    expect(res.isValid).toBe(false);
    expect(res.errors.rejectedQuantity).toBeDefined();
  });

  it('requires rejection reason if rejected > 0', () => {
    const res = validateEntryForm({ ...validBase, rejectedQuantity: 5, rejectionReason: '' });
    expect(res.isValid).toBe(false);
    expect(res.errors.rejectionReason).toBeDefined();
    
    const res2 = validateEntryForm({ ...validBase, rejectedQuantity: 5, rejectionReason: 'Burr' });
    expect(res2.isValid).toBe(true);
  });

  it('requires downtime reason if downtime > 0', () => {
    const res = validateEntryForm({ ...validBase, downtimeMinutes: 10, downtimeReason: '' });
    expect(res.isValid).toBe(false);
    expect(res.errors.downtimeReason).toBeDefined();
  });

  describe('10% Rejection Rule on Submit', () => {
    it('allows > 10% on Draft without remarks', () => {
      // 20 rejected out of 100 = 20%
      const res = validateEntryForm({ ...validBase, rejectedQuantity: 20, rejectionReason: 'Other' }, false);
      expect(res.isValid).toBe(true);
    });

    it('blocks > 10% on Submit without remarks', () => {
      const res = validateEntryForm({ ...validBase, rejectedQuantity: 20, rejectionReason: 'Other', remarks: '' }, true);
      expect(res.isValid).toBe(false);
      expect(res.errors.remarks).toBeDefined();
    });

    it('allows > 10% on Submit WITH remarks', () => {
      const res = validateEntryForm({ ...validBase, rejectedQuantity: 20, rejectionReason: 'Other', remarks: 'Machine calibration failed' }, true);
      expect(res.isValid).toBe(true);
    });
  });

});
