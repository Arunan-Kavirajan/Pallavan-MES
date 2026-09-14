import { describe, it, expect } from 'vitest';
import { 
  calculateAcceptedQuantity, 
  calculateRejectionPercentage, 
  calculateAchievementPercentage, 
  calculateRunningTime 
} from '../src/utils/calculations';

describe('Calculations Core Logic', () => {
  
  describe('calculateAcceptedQuantity', () => {
    it('subtracts rejected from produced', () => {
      expect(calculateAcceptedQuantity(100, 5)).toBe(95);
    });
    
    it('never returns negative (if rejected > produced by mistake)', () => {
      expect(calculateAcceptedQuantity(50, 60)).toBe(0);
    });
    
    it('handles NaN gracefully', () => {
      expect(calculateAcceptedQuantity(NaN, 5)).toBe(0);
    });
  });

  describe('calculateRejectionPercentage', () => {
    it('calculates to one decimal place', () => {
      expect(calculateRejectionPercentage(100, 5)).toBe(5.0);
      expect(calculateRejectionPercentage(100, 1)).toBe(1.0);
      expect(calculateRejectionPercentage(3, 1)).toBe(33.3); // 1/3 = 33.333...
    });
    
    it('handles division by zero (produced = 0)', () => {
      expect(calculateRejectionPercentage(0, 0)).toBe(0.0);
    });
  });

  describe('calculateAchievementPercentage', () => {
    it('calculates to one decimal place', () => {
      expect(calculateAchievementPercentage(100, 95)).toBe(95.0);
      expect(calculateAchievementPercentage(80, 85)).toBe(106.3); // over-achievement
    });
    
    it('handles division by zero (planned = 0)', () => {
      expect(calculateAchievementPercentage(0, 10)).toBe(0.0); 
    });
  });

  describe('calculateRunningTime', () => {
    it('subtracts downtime from 60', () => {
      expect(calculateRunningTime(15)).toBe(45);
      expect(calculateRunningTime(0)).toBe(60);
      expect(calculateRunningTime(60)).toBe(0);
    });
    
    it('bounds downtime between 0 and 60', () => {
      expect(calculateRunningTime(-10)).toBe(60);
      expect(calculateRunningTime(90)).toBe(0);
    });
  });

});
