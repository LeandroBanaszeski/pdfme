import { writeFileSync } from 'fs';
import generate from '../src/generate';
import { label, envelope } from './assets/templates';
import { text, image } from '@pdfme/schemas';
import { getFont, getPdf, getPdfTmpPath, getPdfAssertPath } from './utils';

describe('generate integration test(label, envelope)', () => {
  describe.each([label, envelope])('%s', (templateData) => {
    const entries = Object.entries(templateData);
    for (let l = 0; l < entries.length; l += 1) {
      const [key, template] = entries[l];

      // eslint-disable-next-line no-loop-func
      test(`snapshot ${key}`, async () => {
        const inputs = template.sampledata!;

        const font = getFont();
        font.SauceHanSansJP.fallback = false;
        font.SauceHanSerifJP.fallback = false;
        font['NotoSerifJP-Regular'].fallback = false;
        // @ts-ignore
        font[template.fontName].fallback = true;

        const hrstart = process.hrtime();

        const pdf = await generate({
          inputs,
          template,
          plugins: { text, image },
          options: { font },
        });

        const hrend = process.hrtime(hrstart);
        expect(hrend[0]).toBeLessThanOrEqual(1);

        const tmpFile = getPdfTmpPath(`${key}.pdf`);
        const assertFile = getPdfAssertPath(`${key}.pdf`);

        writeFileSync(tmpFile, pdf);
        const res: any = await Promise.all([getPdf(tmpFile), getPdf(assertFile)]);
        const [a, e] = res;
        expect(a.Pages).toEqual(e.Pages);
      });
    }
  });
});
