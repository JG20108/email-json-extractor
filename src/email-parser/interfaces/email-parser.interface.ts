export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType: string;
}

export interface ParsedEmail {
  text: string;
  html: string;
  attachments: EmailAttachment[];
}
