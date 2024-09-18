import { ParsedMail, Attachment } from 'mailparser';

export interface ParsedEmail extends ParsedMail {}

export interface EmailAttachment extends Attachment {}
