import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { simpleParser, ParsedMail } from 'mailparser';
import * as fs from 'fs';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { ParsedEmailDto } from './dto/parsed-email.dto';
import {
  ParsedEmail,
  EmailAttachment,
} from './interfaces/email-parser.interface';

@Injectable()
export class EmailParserService {
  private readonly logger = new Logger(EmailParserService.name);

  async parseEmailAndExtractJson(path: string): Promise<ParsedEmailDto> {
    try {
      this.logger.log(`Parsing email from path: ${path}`);
      const email = await this.parseEmail(path);

      // Modify the JSON parsing logic to be more permissive
      const jsonContent = await this.extractJsonContent(email);
      if (jsonContent) {
        return { jsonContent };
      }

      this.logger.warn('No JSON found in email');
      throw new HttpException('No JSON found in email', HttpStatus.NOT_FOUND);
    } catch (error) {
      this.logger.error(`Error parsing email: ${error.message}`);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async parseEmail(path: string): Promise<ParsedEmail> {
    try {
      const emailContent = await fs.promises.readFile(path);
      return simpleParser(emailContent);
    } catch (error) {
      this.logger.error(`Error reading email file: ${error.message}`);
      throw new Error(`Failed to read email file: ${error.message}`);
    }
  }

  private async extractJsonContent(email: ParsedEmail): Promise<any | null> {
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
    try {
      const response = await axios.get(url);
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
      const response = await axios.get(url, {
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
      throw new HttpException(
        `Failed to fetch JSON: ${error.message}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
