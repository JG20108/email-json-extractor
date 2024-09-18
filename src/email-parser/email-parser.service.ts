import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { simpleParser, ParsedMail } from 'mailparser';
import * as fs from 'fs';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { ParsedEmailDto } from './dto/parsed-email.dto';
import { ParsedEmail, EmailAttachment } from './interfaces/email-parser.interface';

@Injectable()
export class EmailParserService {
  async parseEmailAndExtractJson(path: string): Promise<ParsedEmailDto> {
    try {
      const email = await this.parseEmail(path);

      // Check for JSON attachment
      const jsonAttachment = this.findJsonAttachment(email.attachments);
      if (jsonAttachment) {
        return { jsonContent: JSON.parse(jsonAttachment.content.toString()) };
      }

      // Check for JSON link in email body
      const jsonLink = this.findJsonLinkInBody(email.text);
      if (jsonLink) {
        const jsonContent = await this.fetchJsonFromUrl(jsonLink);
        return { jsonContent };
      }

      // Check for link to webpage with JSON link
      const webpageLink = this.findWebpageLinkInBody(email.text);
      if (webpageLink) {
        const jsonLink = await this.findJsonLinkInWebpage(webpageLink);
        if (jsonLink) {
          const jsonContent = await this.fetchJsonFromUrl(jsonLink);
          return { jsonContent };
        }
      }

      throw new HttpException('No JSON found in email', HttpStatus.NOT_FOUND);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async parseEmail(path: string): Promise<ParsedEmail> {
    const emailContent = await fs.promises.readFile(path);
    return simpleParser(emailContent);
  }

  private findJsonAttachment(
    attachments: EmailAttachment[],
  ): EmailAttachment | undefined {
    return attachments.find(
      (attachment) => attachment.contentType === 'application/json',
    );
  }

  private findJsonLinkInBody(body: string): string | null {
    const jsonLinkRegex = /https?:\/\/.*\.json/i;
    const match = body.match(jsonLinkRegex);
    return match ? match[0] : null;
  }

  private findWebpageLinkInBody(body: string): string | null {
    const linkRegex = /https?:\/\/\S+/i;
    const match = body.match(linkRegex);
    return match ? match[0] : null;
  }

  private async findJsonLinkInWebpage(url: string): Promise<string | null> {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const jsonLink = $('a[href$=".json"]').attr('href');
    return jsonLink || null;
  }

  private async fetchJsonFromUrl(url: string): Promise<any> {
    const response = await axios.get(url);
    return response.data;
  }
}
