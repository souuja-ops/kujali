import { ICommandHandler } from './i-command-handler';
import { AddNoteToBudgetCommand } from './add-note.command';

type BudgetNotesRepo = {
  addNote: (
    budgetId: string,
    note: { content: string; createdBy: string; createdAt: number }
  ) => Promise<void> | void;
};

type Toolkit = {
  getRepository: (key: 'budgetNotes' | string) => BudgetNotesRepo;
};

export class AddNoteToBudgetHandler
  implements ICommandHandler<AddNoteToBudgetCommand>
{
  async execute(
    command: AddNoteToBudgetCommand,
    toolkit?: Toolkit
  ): Promise<void> {
    if (!command) {
      throw new Error('Command is required');
    }

    const { budgetId, content, createdBy, createdAt } = command;

    if (typeof budgetId !== 'string' || budgetId.trim().length === 0) {
      throw new Error('budgetId must not be empty');
    }
    if (typeof content !== 'string' || content.trim().length === 0) {
      throw new Error('content must not be empty');
    }
    if (typeof createdBy !== 'string' || createdBy.trim().length === 0) {
      throw new Error('createdBy must not be empty');
    }

    const repo = toolkit?.getRepository?.('budgetNotes') as
      | BudgetNotesRepo
      | undefined;

    if (!repo || typeof repo.addNote !== 'function') {
      throw new Error('budgetNotes repository is not available');
    }

    await Promise.resolve(
      repo.addNote(budgetId, { content, createdBy, createdAt })
    );
  }
}
