export interface Message {
  id: string;
  date: string;
  mailfrom: string;
  subject: string;
  data: string;
}

export interface ParsedEmailContent {
  text: string;
  links: string[];
}