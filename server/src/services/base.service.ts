export interface IService {
  start(): Promise<void>;
  stop(): Promise<void>;
}

export abstract class BaseService implements IService {
  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;
}
