import { Injectable } from '@nestjs/common';
import DOMPurify from 'isomorphic-dompurify';

@Injectable()
export class SanitizeService {
  sanitize(html: string): string {
    return DOMPurify.sanitize(html);
  }
}
