import { Injectable, Logger, Inject } from '@nestjs/common';
import { simpleParser, Attachment } from 'mailparser';
import * as cheerio from 'cheerio';
import {
  IEmailParserRepository,
  IFileSystem,
  IHttpClient,
} from '../../domain/interfaces/email-parser.interface';
import { FILE_SYSTEM, HTTP_CLIENT } from '../../domain/constants';
import { ParsedEmail } from '../../domain/entities/parsed-email.entity';

@Injectable()
export class EmailParserRepository implements IEmailParserRepository {
  private readonly logger = new Logger(EmailParserRepository.name);

  constructor(
    @Inject(FILE_SYSTEM)
    private readonly fileSystem: IFileSystem,
    @Inject(HTTP_CLIENT)
    private readonly httpClient: IHttpClient,
  ) {}

  async parseEmail(filePath: string): Promise<ParsedEmail> {
    const emailContent = await this.fileSystem.readFile(filePath);
    const parsedEmail = await simpleParser(emailContent);
    const jsonContent = await this.extractJsonContent(parsedEmail);
    return new ParsedEmail(jsonContent);
  }

  private async extractJsonContent(
    email: any,
  ): Promise<Record<string, any> | null> {
    // Check for JSON in email text (which includes the attachment content in this case)
    const jsonMatch = email.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const jsonContent = JSON.parse(jsonMatch[0]);
        return jsonContent;
      } catch (e) {
        this.logger.error(`Error parsing JSON from email text: ${e.message}`);
      }
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
      const jsonContent = JSON.parse(email.text);
      return jsonContent;
    } catch (e) {
      this.logger.warn('No JSON content found in email');
      return null;
    }
  }

  private findJsonAttachment(attachments: Attachment[]): Attachment | null {
    this.logger.log(`Number of attachments: ${attachments.length}`);
    for (const attachment of attachments) {
      this.logger.log(
        `Checking attachment: ${attachment.filename}, Content-Type: ${attachment.contentType}`,
      );
      this.logger.log(
        `Attachment content: ${attachment.content.toString('utf8')}`,
      );
      if (
        attachment.contentType === 'application/json' ||
        (attachment.filename && attachment.filename.endsWith('.json'))
      ) {
        this.logger.log(`JSON attachment found: ${attachment.filename}`);
        return attachment;
      }
    }
    this.logger.warn('No JSON attachment found');
    return null;
  }

  private findJsonLinkInBody(body: string): string | null {
    const jsonLinkRegex = /https?:\/\/.*\.json|https?:\/\/api\.github\.com\S*/i;
    const match = body.match(jsonLinkRegex);
    this.logger.log(`JSON link match: ${match ? match[0] : 'None'}`);
    return match ? match[0] : null;
  }

  private findWebpageLinkInBody(body: string): string | null {
    const linkRegex = /https?:\/\/\S+/i;
    const match = body.match(linkRegex);
    return match ? match[0] : null;
  }

  private async findJsonLinkInWebpage(url: string): Promise<string | null> {
    try {
      const response = await this.httpClient.get<string>(url);
      const $ = cheerio.load(response.data);

      // Check for JSON content in the page
      const jsonContent = $('pre').text();
      if (jsonContent) {
        try {
          JSON.parse(jsonContent);
          return url; // Return the original URL if we found valid JSON content
        } catch (e) {
          // Not valid JSON, continue to other checks
        }
      }

      // Check for links to JSON files
      const jsonLink = $('a[href$=".json"]').attr('href');
      if (jsonLink) {
        return jsonLink.startsWith('http')
          ? jsonLink
          : new URL(jsonLink, url).toString();
      }

      // Check for API endpoints
      const apiLink = $('a[href*="api"]').attr('href');
      if (apiLink) {
        return apiLink.startsWith('http')
          ? apiLink
          : new URL(apiLink, url).toString();
      }

      // GitHub-specific check (keep this for backward compatibility)
      if (url.includes('github.com')) {
        const rawLink = $('a[data-testid="raw-button"]').attr('href');
        if (rawLink) {
          return `https://github.com${rawLink}`;
        }
      }

      return null;
    } catch (error) {
      this.logger.error(`Error finding JSON link in webpage: ${error.message}`);
      return null;
    }
  }

  private async fetchJsonFromUrl(url: string): Promise<Record<string, any>> {
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
