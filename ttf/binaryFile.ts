import {
  Uint8,
  Uint16,
  Uint32,
  Int16,
  Int32,
  FWord,
  Fixed,
  UFWord,
  F2Dot14,
  Offset16,
  Offset32,
} from './types';

export type BinaryFile = {
  getUint8: () => Uint8;
  getUint16: () => Uint16;
  getUint32: () => Uint32;
  getInt16: () => Int16;
  getInt32: () => Int32;
  getFWord: () => FWord;
  getUFWord: () => UFWord;
  getOffset16: () => Offset16;
  getOffset32: () => Offset32;
  getF2Dot14: () => F2Dot14;
  getFixed: () => Fixed;
  getString: (length: number) => string;
  getDate: () => Date;
  getPosition: () => number;
  setPosition: (targetPosition: number) => void;
};

const binaryFile = (buffer: Buffer): BinaryFile => {
  const data: Uint8Array = new Uint8Array(buffer);
  let position = 0;

  const getUint8 = () => data[position++];
  const getUint16 = () => ((getUint8() << 8) | getUint8()) >>> 0;
  const getUint32 = () => getInt32() >>> 0;
  const getInt16 = () => {
    let number = getUint16();
    if (number & 0x8000) {
      number -= 1 << 16;
    }
    return number;
  };
  const getInt32 = () =>
    (getUint8() << 24) | (getUint8() << 16) | (getUint8() << 8) | getUint8();

  const getFWord = getInt16;

  const getUFWord = getUint16;

  const getOffset16 = getUint16;

  const getOffset32 = getUint32;

  const getF2Dot14 = () => getInt16() / (1 << 14);

  const getFixed = () => getInt32() / (1 << 16);

  const getString = (length: number) => {
    let string = '';
    for (let i = 0; i < length; i++) {
      string += String.fromCharCode(getUint8());
    }
    return string;
  };

  const getDate = () => {
    const macTime = getUint32() * 0x100000000 + getUint32();
    const utcTime = macTime * 1000 + Date.UTC(1904, 1, 1);
    return new Date(utcTime);
  };

  const getPosition = () => position;
  const setPosition = (targetPosition: number) => (position = targetPosition);

  return {
    getUint8,
    getUint16,
    getUint32,
    getInt16,
    getInt32,
    getFWord,
    getUFWord,
    getOffset16,
    getOffset32,
    getF2Dot14,
    getFixed,
    getString,
    getDate,
    getPosition,
    setPosition,
  };
};

export default binaryFile;
