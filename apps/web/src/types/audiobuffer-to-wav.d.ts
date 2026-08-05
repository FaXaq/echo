declare module "audiobuffer-to-wav" {
  function toWav(buffer: AudioBuffer, options?: { float32?: boolean }): ArrayBuffer;
  export default toWav;
}
