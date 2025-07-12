export type RootStackParamList = {
  Home: undefined;
  Processing: { videoUri: string };
  Preview: { clips: string[]; thumbs?: string[] };
};