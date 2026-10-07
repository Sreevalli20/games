import * as THREE from 'three';
import { sound } from './audio';
import { DialogueMessage } from './types';
import { MetroWorld } from './world';
import { FirstPersonCamera } from './camera';

export class CinematicController {
  private camera: FirstPersonCamera;
  private world: MetroWorld;

  // Intro states
  public isIntroPlaying: boolean = false;
  public introTimer: number = 0;
  public blackScreenOpacity: number = 1.0;
  public currentDialogue: DialogueMessage | null = null;
  private dialogueQueue: DialogueMessage[] = [];
  private dialogueTimer: number = 0;

  // Ending states
  public isEndingPlaying: boolean = false;
  public endingTimer: number = 0;
  public endingFinished: boolean = false;

  constructor(camera: FirstPersonCamera, world: MetroWorld) {
    this.camera = camera;
    this.world = world;
  }

  public startIntro(onIntroComplete: () => void): void {
    this.isIntroPlaying = true;
    this.introTimer = 0;
    this.blackScreenOpacity = 1.0;
    this.world.phantomTrainActive = false;

    // Start with camera angled down at platform
    this.camera.setRotation(0, -0.2);

    // Schedule story beats
    this.dialogueQueue = [
      {
        id: 'intro_1',
        speaker: 'MIRA',
        speakerLabel: 'MIRA',
        text: 'Can you hear me?',
        duration: 3.2,
        offsetLabel: 'OFFSET: -9.00s',
      },
      {
        id: 'intro_2',
        speaker: 'PROTAGONIST',
        speakerLabel: 'PLAYER',
        text: 'Who are you?',
        duration: 2.8,
      },
      {
        id: 'intro_3',
        speaker: 'MIRA',
        speakerLabel: 'MIRA',
        text: "Someone you're about to forget.",
        duration: 3.5,
        offsetLabel: 'OFFSET: -9.00s',
      },
    ];

    this.onIntroCompleteCallback = onIntroComplete;
  }

  private onIntroCompleteCallback: (() => void) | null = null;

  public triggerRadioMessage(msg: DialogueMessage): void {
    sound.playRadioBeep();
    this.currentDialogue = msg;
    this.dialogueTimer = msg.duration;
  }

  public startEnding(onEndingComplete: () => void): void {
    this.isEndingPlaying = true;
    this.endingTimer = 0;
    sound.playEndingHarmony();

    this.currentDialogue = {
      id: 'ending_1',
      speaker: 'MIRA',
      speakerLabel: 'MIRA',
      text: 'This time... don\'t rewind.',
      duration: 4.5,
      offsetLabel: 'TIMELINES SYNCHRONIZED',
    };
    this.dialogueTimer = 4.5;

    this.onEndingCompleteCallback = onEndingComplete;
  }

  private onEndingCompleteCallback: (() => void) | null = null;

  public update(delta: number): void {
    // 1. Dialogue popup management
    if (this.currentDialogue) {
      this.dialogueTimer -= delta;
      if (this.dialogueTimer <= 0) {
        this.currentDialogue = null;
        if (this.dialogueQueue.length > 0) {
          const next = this.dialogueQueue.shift()!;
          this.triggerRadioMessage(next);
        }
      }
    }

    // 2. Intro Cinematic step logic
    if (this.isIntroPlaying) {
      this.introTimer += delta;

      // 0 - 2s: Black screen, rain ambience, electrical humming
      if (this.introTimer < 2.0) {
        this.blackScreenOpacity = 1.0;
      }
      // 2.0s: Emergency lights flicker on, screen fades in
      else if (this.introTimer >= 2.0 && this.introTimer < 4.5) {
        const progress = (this.introTimer - 2.0) / 2.5;
        this.blackScreenOpacity = Math.max(0, 1.0 - progress);
      }
      // 4.5s: Phantom train rushes by
      else if (this.introTimer >= 4.5 && this.introTimer < 5.0 && !this.world.phantomTrainActive) {
        this.world.phantomTrainActive = true;
        sound.playPhantomTrain();
        this.camera.addShake(0.2);
      }
      // 6.5s: Radio activates, plays dialogues
      else if (this.introTimer >= 6.5 && !this.currentDialogue && this.dialogueQueue.length === 3) {
        const next = this.dialogueQueue.shift()!;
        this.triggerRadioMessage(next);
      }

      // Complete intro when dialogues conclude (~17s or when skipped)
      if (this.introTimer > 16.5 || (this.introTimer > 7.0 && this.dialogueQueue.length === 0 && !this.currentDialogue)) {
        this.isIntroPlaying = false;
        this.blackScreenOpacity = 0;
        if (this.onIntroCompleteCallback) {
          this.onIntroCompleteCallback();
          this.onIntroCompleteCallback = null;
        }
      }
    }

    // 3. Ending Cinematic step logic
    if (this.isEndingPlaying) {
      this.endingTimer += delta;

      // Camera slowly looks up into the resonant light
      this.camera.pitch = THREE.MathUtils.lerp(this.camera.pitch, 0.15, delta * 0.8);

      if (this.endingTimer > 3.5) {
        // Fade to black
        this.blackScreenOpacity = Math.min(1.0, (this.endingTimer - 3.5) / 2.5);
      }

      if (this.endingTimer > 6.5) {
        this.endingFinished = true;
        if (this.onEndingCompleteCallback) {
          this.onEndingCompleteCallback();
          this.onEndingCompleteCallback = null;
        }
      }
    }
  }

  public skipIntro(): void {
    if (this.isIntroPlaying) {
      this.isIntroPlaying = false;
      this.blackScreenOpacity = 0;
      this.currentDialogue = null;
      this.dialogueQueue = [];
      if (this.onIntroCompleteCallback) {
        this.onIntroCompleteCallback();
        this.onIntroCompleteCallback = null;
      }
    }
  }
}
