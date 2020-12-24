let micHandler: (data: MicInput) => void;

const handleSuccess = (stream: MediaStream) => {
	const audioContext = new AudioContext({sampleRate: 11025});
	const source = audioContext.createMediaStreamSource(stream);
	const processor = audioContext.createScriptProcessor(1024*2, 1,1);

	source.connect(processor);
	processor.connect(audioContext.destination);

	processor.onaudioprocess = (ev: AudioProcessingEvent) => {
		const rawData = ev.inputBuffer.getChannelData(0);
		const sampleSummed = rawData.reduce((acc, sample) => {
			return acc += Math.abs(sample);
		}, 0);

		if (micHandler) {
			micHandler({raw: rawData, isSilent: sampleSummed < 10});
		}
	};
}

function handleError(error: any) {
  const errorMessage = 'navigator.MediaDevices.getUserMedia error: ' + error.message + ' ' + error.name;
  console.log(errorMessage);
}

navigator.mediaDevices
	.getUserMedia({audio: true, video: false})
	.then(handleSuccess)
	.catch(handleError);

export interface MicInput {
	raw: Float32Array;
	isSilent: boolean;
};

export default {
	onRawAudio: (handler: (data: MicInput) => void) => {
		micHandler = handler;
	}
};