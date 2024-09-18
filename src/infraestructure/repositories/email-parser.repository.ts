import { Injectable, Logger } from '@nestjs/common';
import { simpleParser } from 'mailparser';
import * as cheerio from 'cheerio';
import {
  IEmailParserRepository,
  IFileSystem,
  IHttpClient,
} from '../../domain/interfaces/email-parser.interface';
import { ParsedEmail } from '../../domain/entities/parsed-email.entity';

@Injectable()
export class EmailParserRepository implements IEmailParserRepository {
  private readonly logger = new Logger(EmailParserRepository.name);

  constructor(
    private readonly fileSystem: IFileSystem,
    private readonly httpClient: IHttpClient,
  ) {}

  async parseEmail(filePath: string): Promise<ParsedEmail> {
    const emailContent = await this.fileSystem.readFile(filePath);
    const parsedEmail = await simpleParser(emailContent);
    const jsonContent = await this.extractJsonContent(parsedEmail);
    return new ParsedEmail(jsonContent);
  }

  private async extractJsonContent(email: any): Promise<Record<string, any> | null> {
    // Check for JSON attachment
    const jsonAttachment = this.findJsonAttachment(email.attachments);
    if (jsonAttachment) {
      this.logger.log('JSON attachment found');
      return JSON.parse(jsonAttachment.content.toString());
    }

    // Check for JSON link in email body
    const jsonLink = this.findJsonLinkInBody(email.text);
    if (jsonLink) {
      this.logger.log(`JSON link found: ${jsonLink}`);
      return await this.fetchJsonFromUrl(jsonLink);
    }

    // Check for link to webpage with JSON link
    const webpageLink = this.findWebpageLinkInBody(email.text);
    if (webpageLink) {
      this.logger.log(`Webpage link found: ${webpageLink}`);
      const jsonLink = await this.findJsonLinkInWebpage(webpageLink);
      if (jsonLink) {
        this.logger.log(`JSON link found in webpage: ${jsonLink}`);
        return await this.fetchJsonFromUrl(jsonLink);
      }
    }

    // Try to parse the email body itself as JSON
    try {
      return JSON.parse(email.text);
    } catch (e) {
      return null;
    }
  }

  private findJsonAttachment(attachments: any[]): any {
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
    try {
      const response = await this.httpClient.get(url);
      const $ = cheerio.load(response.data);

      // Check if we're on a GitHub page
      if (url.includes('github.com')) {
        // Find the 'Raw' button link
        const rawLink = $('a[data-testid="raw-button"]').attr('href');
        if (rawLink) {
          return `https://github.com${rawLink}`;
        }
        // If 'Raw' button is not found, try to find the content directly
        const jsonContent = $('.blob-code-inner').text();
        if (jsonContent) {
          try {
            JSON.parse(jsonContent);
            return url; // Return the original URL if we found valid JSON content
          } catch (e) {
            // Not valid JSON, continue to fallback logic
          }
        }
      }

      // Fallback to previous logic
      const jsonLink = $('a[href$=".json"]').attr('href');
      if (jsonLink) {
        return jsonLink.startsWith('http')
          ? jsonLink
          : new URL(jsonLink, url).toString();
      }

      return null;
    } catch (error) {
      this.logger.error(`Error finding JSON link in webpage: ${error.message}`);
      return null;
    }
  }

  private async fetchJsonFromUrl(url: string): Promise<any> {
    this.logger.log(`Fetching JSON from URL: ${url}`);
    try {
      const response = await this.httpClient.get(url, {
        headers: { Accept: 'application/json' },
      });

      if (typeof response.data === 'string') {
        if (response.data.includes('<!DOCTYPE html>')) {
          // If it's an HTML page, extract the JSON content
          const $ = cheerio.load(response.data);
          const jsonContent = $('.blob-code-inner').text();
          if (jsonContent) {
            return JSON.parse(jsonContent);
          }
        } else {
          // If it's a string, try parsing it as JSON
          return JSON.parse(response.data);
        }
      }

      // If it's already an object, return it directly
      return response.data;
    } catch (error) {
      this.logger.error(`Error fetching JSON from URL: ${error.message}`);
      throw new Error(`Failed to fetch JSON: ${error.message}`);
    }
  }
}
