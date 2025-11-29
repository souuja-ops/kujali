export interface ICommandHandler<TCommand> {
  execute(command: TCommand, toolkit?: any): Promise<void>;
}
