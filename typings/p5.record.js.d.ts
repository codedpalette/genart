import "p5"

declare module "p5.record.js" {
	// biome-ignore lint/complexity/noBannedTypes: p5Record is only used for passing to p5.registerAddon
	export declare const p5Record: Function
}

declare module "p5" {
	export default interface p5 {
		setRecording(options: Partial<{ frameRate: number; source: HTMLCanvasElement; mimeType: string }>)
		startRecording(): void
		stopRecording(): void
		pauseRecording(): void
		resumeRecording(): void
		createRecording(options: { frameRate: number; source: HTMLCanvasElement; stopCallback: (blob: Blob) => void }): void
	}
}
