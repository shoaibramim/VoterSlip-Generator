export interface VoterData {
  id: string;
  serial_no: string;
  voter_name_bn: string;
  voter_no_bd: string;
  father_name_bn: string;
  mother_name_bn: string;
  profession_bn?: string;
  date_of_birth_bn?: string;
  address_bn?: string;
}

export interface GlobalVoterInfo {
  voteCenter: string;
  voterArea: string;
}

export interface ProcessingStatus {
  step: 'idle' | 'extracting' | 'generating' | 'completed' | 'error';
  message: string;
}

export type PageSize = 'A4' | 'Legal';

export type AspectRatio = '1:1' | '3:4';

export interface TemplateConfig {
  file: Uint8Array;
  name: string;
  fileType: 'pdf' | 'image'; // jpg, png are treated as image
  aspectRatio: AspectRatio;
  width: number;
  height: number;
}
