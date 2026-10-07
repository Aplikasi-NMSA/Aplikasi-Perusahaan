import React from 'react';
import { SignerConfigItem } from './SignerSettingsModal';

export interface F2SignaturesBlockProps {
  signers: SignerConfigItem[];
  style: 'table' | 'line';
  showApproved: boolean;
  density?: 'normal' | 'dense' | 'ultra_dense' | 'few_items';
  isCompact?: boolean;
}

export const F2SignaturesBlock: React.FC<F2SignaturesBlockProps> = ({
  signers,
  style,
  showApproved,
  density = 'normal',
  isCompact = false,
}) => {
  const isSigner1Active = signers[0] ? signers[0].enabled !== false : true;
  const isSigner2Active = signers[1] ? signers[1].enabled !== false : true;

  const defaultSigner1 = { title: 'Dibuat Oleh', name: 'Nur Wahyudi', role: 'Staff Keuangan' };
  const defaultSigner2 = { title: 'Diajukan', name: 'Sri Ekowati', role: 'Manager Keuangan' };

  const signer1 = (isSigner1Active ? signers[0] : (isSigner2Active ? signers[1] : null)) || defaultSigner1;
  const signer2 = signers[1] || defaultSigner2;

  const getGapHeightClass = () => {
    if (density === 'ultra_dense') return 'h-8 print:h-8 min-h-[32px]';
    if (density === 'dense') return 'h-10 sm:h-11 print:h-10 min-h-[40px]';
    if (isCompact) return 'h-10 sm:h-11 print:h-10 min-h-[40px]';
    // Proportional & neat signature height (standard voucher signature space without excessive vertical stretch)
    return 'h-13 sm:h-14 print:h-13 min-h-[48px] sm:min-h-[52px]';
  };

  const gapHeight = getGapHeightClass();

  // If NOT both signers active or not showApproved, only show 1 signer
  if (!showApproved || !isSigner1Active || !isSigner2Active) {
    if (style === 'table') {
      return (
        <div className={`text-black w-full max-w-[200px] mx-auto ${density === 'ultra_dense' ? 'my-1' : 'my-2 sm:my-2.5 print:my-1.5'}`}>
          <table className="w-full border-collapse border-2 border-black text-center font-sans table-fixed">
            <thead>
              <tr className="border-b-2 border-black bg-white">
                <th className="py-1 px-2 font-bold uppercase tracking-wider text-[10px] sm:text-[10.5px] print:text-[10px] text-black">
                  {signer1.title}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b-2 border-black">
                <td className={gapHeight} />
              </tr>
              <tr>
                <td className="px-2 py-1.5 align-top">
                  <span className="font-bold tracking-tight uppercase text-[10.5px] sm:text-[11px] print:text-[10.5px] text-black block leading-tight text-center break-words">
                    {signer1.name}
                  </span>
                  {/* Garis tipis pemisah antara nama dan jabatan */}
                  <div className="w-3/4 max-w-[140px] mx-auto border-b border-black my-1 print:my-0.5" />
                  <span className="font-bold tracking-tight uppercase text-[8.5px] sm:text-[9px] print:text-[8.5px] text-stone-900 block leading-tight text-center break-words">
                    {signer1.role}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }

    // Line Style (1 Signer)
    return (
      <div className={`text-black w-full max-w-[200px] mx-auto text-center ${density === 'ultra_dense' ? 'my-1' : 'my-2 sm:my-2.5 print:my-1.5'}`}>
        <span className="font-sans font-semibold uppercase text-[10px] sm:text-[10.5px] print:text-[10px] block truncate">
          {signer1.title}
        </span>
        <div className={`w-full ${gapHeight}`} />
        <div className="w-full max-w-[150px] mx-auto border-b border-black pb-0.5 flex items-center justify-center px-1">
          <span className="font-bold text-[10.5px] sm:text-[11px] print:text-[10.5px] uppercase tracking-tight block text-center break-words leading-tight">
            {signer1.name}
          </span>
        </div>
        <span className="text-[8.5px] sm:text-[9px] print:text-[8.5px] text-stone-700 font-mono mt-0.5 uppercase font-medium block text-center break-words">
          {signer1.role}
        </span>
      </div>
    );
  }

  // 2 Signers (Dibuat Oleh & Diajukan / Disetujui)
  if (style === 'table') {
    return (
      <div className={`text-black w-full max-w-[400px] mx-auto ${density === 'ultra_dense' ? 'my-1' : 'my-2 sm:my-2.5 print:my-1.5'}`}>
        <table className="w-full border-collapse border-2 border-black text-center font-sans table-fixed">
          <colgroup>
            <col className="w-1/2" style={{ width: '50%' }} />
            <col className="w-1/2" style={{ width: '50%' }} />
          </colgroup>
          <thead>
            <tr className="border-b-2 border-black bg-white">
              <th className="w-1/2 border-r-2 border-black py-1 px-2 font-bold uppercase tracking-wider text-[10px] sm:text-[10.5px] print:text-[10px] text-black">
                {signer1.title}
              </th>
              <th className="w-1/2 py-1 px-2 font-bold uppercase tracking-wider text-[10px] sm:text-[10.5px] print:text-[10px] text-black">
                {signer2.title}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b-2 border-black">
              <td className={`w-1/2 border-r-2 border-black ${gapHeight}`} />
              <td className={`w-1/2 ${gapHeight}`} />
            </tr>
            <tr>
              <td className="w-1/2 border-r-2 border-black px-2 py-1.5 align-top">
                <span className="font-bold tracking-tight uppercase text-[10.5px] sm:text-[11px] print:text-[10.5px] text-black block leading-tight text-center break-words">
                  {signer1.name}
                </span>
                {/* Garis tipis pemisah antara nama dan jabatan */}
                <div className="w-3/4 max-w-[140px] mx-auto border-b border-black my-1 print:my-0.5" />
                <span className="font-bold tracking-tight uppercase text-[8.5px] sm:text-[9px] print:text-[8.5px] text-stone-900 block leading-tight text-center break-words">
                  {signer1.role}
                </span>
              </td>
              <td className="w-1/2 px-2 py-1.5 align-top">
                <span className="font-bold tracking-tight uppercase text-[10.5px] sm:text-[11px] print:text-[10.5px] text-black block leading-tight text-center break-words">
                  {signer2.name}
                </span>
                {/* Garis tipis pemisah antara nama dan jabatan */}
                <div className="w-3/4 max-w-[140px] mx-auto border-b border-black my-1 print:my-0.5" />
                <span className="font-bold tracking-tight uppercase text-[8.5px] sm:text-[9px] print:text-[8.5px] text-stone-900 block leading-tight text-center break-words">
                  {signer2.role}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  // Line Style (2 Signers)
  return (
    <div className={`text-black w-full max-w-[400px] mx-auto ${density === 'ultra_dense' ? 'my-1' : 'my-2 sm:my-2.5 print:my-1.5'}`}>
      <div className="grid grid-cols-2 gap-4 w-full px-2 text-center">
        <div className="flex flex-col items-center">
          <span className="font-sans font-semibold uppercase text-[10px] sm:text-[10.5px] print:text-[10px] block truncate">
            {signer1.title}
          </span>
          <div className={`w-full ${gapHeight}`} />
          <div className="w-full max-w-[150px] border-b border-black pb-0.5 flex items-center justify-center px-1">
            <span className="font-bold text-[10.5px] sm:text-[11px] print:text-[10.5px] uppercase tracking-tight block text-center break-words leading-tight">
              {signer1.name}
            </span>
          </div>
          <span className="text-[8.5px] sm:text-[9px] print:text-[8.5px] text-stone-700 font-mono mt-0.5 uppercase font-medium block text-center break-words">
            {signer1.role}
          </span>
        </div>

        <div className="flex flex-col items-center">
          <span className="font-sans font-semibold uppercase text-[10px] sm:text-[10.5px] print:text-[10px] block truncate">
            {signer2.title}
          </span>
          <div className={`w-full ${gapHeight}`} />
          <div className="w-full max-w-[150px] border-b border-black pb-0.5 flex items-center justify-center px-1">
            <span className="font-bold text-[10.5px] sm:text-[11px] print:text-[10.5px] uppercase tracking-tight block text-center break-words leading-tight">
              {signer2.name}
            </span>
          </div>
          <span className="text-[8.5px] sm:text-[9px] print:text-[8.5px] text-stone-700 font-mono mt-0.5 uppercase font-medium block text-center break-words">
            {signer2.role}
          </span>
        </div>
      </div>
    </div>
  );
};
