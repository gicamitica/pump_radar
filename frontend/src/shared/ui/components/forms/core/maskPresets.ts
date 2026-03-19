import { IMask } from 'react-imask';
import type { FactoryOpts } from 'imask';

/**
 * Common mask presets for consistent UI/UX across the application.
 * These presets ensure that input masking is deterministic and user-friendly.
 * Based on https://imask.js.org/guide.html
 */
export const MASK_PRESETS = {
  /**
   * US Phone Number format: (000) 000-0000
   * Stores unmasked value by default logic if handled in component.
   */
  PHONE_US: {
    mask: '(000) 000-0000',
    lazy: false, // Eagerly shows the mask structure
  } as FactoryOpts,

  /**
   * Simple 5-digit Zip Code
   */
  ZIP_CODE: {
    mask: '00000',
    lazy: true,
  } as FactoryOpts,

  /**
   * US Currency format.
   * Handles thousands separator, 2 decimal places.
   */
  CURRENCY_USD: {
    mask: 'num',
    lazy: false,
    blocks: {
      num: {
        mask: Number,
        scale: 2,
        signed: false,
        thousandsSeparator: ' ',
        padFractionalZeros: false,
        normalizeZeros: true,
        radix: '.',
        mapToRadix: ['.'],
      }
    }
  } as FactoryOpts,

  /**
   * Credit Card Number (Simple 16 digit grouping)
   * 0000 0000 0000 0000
   */
  CREDIT_CARD: {
    mask: 'XXXX XXXX XXXX 0000',
    lazy: true,
    definitions: {
      X: {
        mask: '0',
        displayChar: '*',
        placeholderChar: '*',
      },
    },
  } as FactoryOpts,
  
  /**
   * Verified Date format: MM/DD/YYYY
   * Uses MaskedRange for strict validation of day (1-31) and month (1-12).
   */
  DATE_US: {
    mask: Date,
    pattern: 'm{/}`d{/}`Y',
    blocks: {
      d: { mask: IMask.MaskedRange, from: 1, to: 31, maxLength: 2 },
      m: { mask: IMask.MaskedRange, from: 1, to: 12, maxLength: 2 },
      Y: { mask: IMask.MaskedRange, from: 1900, to: 9999 },
    },
    format: (date: Date) => {
      let day: string | number = date.getDate();
      let month: string | number = date.getMonth() + 1;
      const year = date.getFullYear();

      if (day < 10) day = "0" + day;
      if (month < 10) month = "0" + month;

      return [month, day, year].join('/');
    },
    parse: (str: string) => {
      const [month, day, year] = str.split('/');
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    },
    lazy: false,
    autofix: true,
  } as FactoryOpts,

  /**
   * SSN format: 000-00-0000
   */
  SSN: {
    mask: '000-00-0000',
    lazy: false,
  } as FactoryOpts,

  /**
   * Time format: HH:mm (24-hour)
   */
  TIME: {
    mask: 'HH:MM',
    lazy: false,
    blocks: {
      HH: { mask: IMask.MaskedRange, from: 0, to: 23, maxLength: 2 },
      MM: { mask: IMask.MaskedRange, from: 0, to: 59, maxLength: 2 },
    },
  } as FactoryOpts,

  /**
   * Date and Time format: MM/DD/YYYY HH:mm
   */
  DATE_TIME: {
    mask: 'm{/}`d{/}`Y HH:MM',
    lazy: false,
    blocks: {
      d: { mask: IMask.MaskedRange, from: 1, to: 31, maxLength: 2 },
      m: { mask: IMask.MaskedRange, from: 1, to: 12, maxLength: 2 },
      Y: { mask: IMask.MaskedRange, from: 1900, to: 9999 },
      HH: { mask: IMask.MaskedRange, from: 0, to: 23, maxLength: 2 },
      MM: { mask: IMask.MaskedRange, from: 0, to: 59, maxLength: 2 },
    },
  } as FactoryOpts,

  /**
   * Generic Number mask
   * - scale: 0 (integers only by default, change to X for decimals)
   * - signed: false (positive only)
   */
  NUMBER: {
    mask: Number,
    scale: 0,
    thousandsSeparator: ',',
    radix: '.',
    mapToRadix: ['.'],
  } as FactoryOpts,

  /**
   * Percentage format: 0-100%
   */
  PERCENTAGE: {
    mask: Number,
    min: 0,
    max: 100,
    scale: 0,
    signed: false,
    mapToRadix: ['.'],
  } as FactoryOpts,

  /* -----------------------------
  * IBAN
  * ----------------------------*/
  IBAN: {
    mask: 'AA00 0000 0000 0000 0000 0000',
    prepare: (str: string) => str.toUpperCase(),
  } as FactoryOpts,

  /**
   * IPv4 Address
   * Blocks enforce 0-255 range for each octet.
   */
  IP_ADDRESS: {
    mask: 'num.num.num.num',
    blocks: {
      num: {
        mask: IMask.MaskedRange,
        from: 0,
        to: 255,
      }
    }
  } as FactoryOpts,

  /**
   * MAC Address
   * 6 groups of 2 hexadecimal digits.
   */
  MAC_ADDRESS: {
    mask: 'XX:XX:XX:XX:XX:XX',
    lazy: true,
    definitions: {
      'X': {
        mask: 'h', // hex definition
        prepare: (str: string) => str.toUpperCase(),
      }
    },
    blocks: {
      X: { mask: /^[0-9a-fA-F]$/ }
    }
  } as FactoryOpts,

  /**
   * Vehicle Identification Number (VIN)
   * 17 alphanumeric characters, uppercase.
   */
  VIN: {
    mask: '*****************',
    prepare: (str: string) => str.toUpperCase(),
    definitions: {
      '*': /^[0-9a-zA-Z]$/
    }
  } as FactoryOpts,
}
