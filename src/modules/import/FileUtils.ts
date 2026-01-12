import { pdfjs, type TextItem } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

export class FileUtils {

    /** File types to accept (e.g., ['.json', '.csv', 'image/*']) */
    static async fileTypeMatch(file: File, supportedTypes: string[]): Promise<boolean> {
        return supportedTypes.some(type => {
            if (type.startsWith('.')) return file.name.toLowerCase().endsWith(type.toLowerCase());
            else if (type.includes('*')) {
                const baseType = type.split('/')[0];
                return file.type.startsWith(baseType);
            } else return file.type == type;
        });
    }

    private static convertToArrayBuffer(file: File): Promise<ArrayBuffer> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as ArrayBuffer);
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    static async readPdfFile(file: File, password?: string): Promise<string[][]> {
        const buffer = await this.convertToArrayBuffer(file);
        const pdf = await pdfjs.getDocument({ data: buffer, password: password }).promise;
        const pages = new Array<string[]>();
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const text = textContent.items
                .filter(item => 'str' in item)
                .map(item => item as TextItem)
                .map(item => item.str + (item.hasEOL ? '\n' : '')).join(' ');
            pages.push(text.split('\n').map(line => line.trim()));
        }
        return pages;
    }
}