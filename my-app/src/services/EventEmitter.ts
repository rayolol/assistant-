import mitt, { Emitter } from "mitt";

type EventMap = {
  [event: string]: any; // or define specific event names
};

export class AppEventEmitter<T extends EventMap> {
  private emitter: Emitter<T>;

  constructor(private channels: (keyof T)[]) {
    try {
      this.emitter = mitt<T>();
      console.log("created instance")
    } catch (e) {
      console.error("error in instance creation", e)
    }
    
  }

  public sendData<K extends keyof T>(channel: K, data: T[K]) {
    this.emitter.emit(channel, data);
    
  }

  public listen<K extends keyof T>(channel: K, handler: (data: T[K]) => void) {
    this.emitter.on(channel, handler);
  }

  public off<K extends keyof T>(channel: K, handler: (data: T[K]) => void) {
    this.emitter.off(channel, handler);
  }

  public getAllChannels(callback: (channels: (keyof T)[]) => void): void {
    callback(this.channels);
  }
  
}
