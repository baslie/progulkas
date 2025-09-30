declare module "html-pdf-node" {
  type HtmlPdfSource = {
    content: string;
  };

  type HtmlPdfOptions = {
    format?: string;
    margin?: {
      top?: string;
      right?: string;
      bottom?: string;
      left?: string;
    };
    printBackground?: boolean;
  };

  export function generatePdf(source: HtmlPdfSource, options?: HtmlPdfOptions): Promise<Buffer>;
}
