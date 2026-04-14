import { Injectable } from '@nestjs/common';

@Injectable()
export class AiService {
  summarize(text: string) {
    // TODO: OpenAI 연동
    return { result: `(요약) ${text.slice(0, 120)}` };
  }

  refine(text: string) {
    // TODO: OpenAI 연동
    return { result: `(다듬기) ${text.slice(0, 120)}` };
  }

  draft(prompt: string) {
    // TODO: OpenAI 연동
    return { result: `(초안) ${prompt.slice(0, 120)}` };
  }
}
