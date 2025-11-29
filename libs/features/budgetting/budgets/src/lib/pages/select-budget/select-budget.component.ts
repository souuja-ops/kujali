import { Component, OnInit } from '@angular/core';
import { ChangeDetectionStrategy, computed, inject, Signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { toSignal } from '@angular/core/rxjs-interop';

import { cloneDeep as ___cloneDeep, flatMap as __flatMap } from 'lodash';
import { Observable, combineLatest, map } from 'rxjs';

import { Logger } from '@iote/bricks-angular';

import { Budget, BudgetRecord, BudgetStatus, OrgBudgetsOverview } from '@app/model/finance/planning/budgets';

import { BudgetsStore, OrgBudgetsStore } from '@app/state/finance/budgetting/budgets';

import { CreateBudgetModalComponent } from '../../components/create-budget-modal/create-budget-modal.component';


@Component({
  selector: 'app-select-budget',
  templateUrl: './select-budget.component.html',
  styleUrls: ['./select-budget.component.scss', 
              '../../components/budget-view-styles.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
/** List of all active budgets on the system. */
export class SelectBudgetPageComponent implements OnInit
{
  /** Overview which contains all budgets of an organisation */
  overview$!: Observable<OrgBudgetsOverview>;
  sharedBudgets$: Observable<any[]>;

  showFilter = false;

  // budgetsLoaded: boolean = false;

  allBudgets$: Observable<{overview: BudgetRecord[], budgets: any[]}>;

  readonly overview: Signal<OrgBudgetsOverview | undefined> = toSignal<OrgBudgetsOverview | undefined>(
    this._orgBudgets$$.get(),
    { initialValue: undefined }
  );
  readonly sharedBudgets: Signal<any[] | undefined> = toSignal<any[] | undefined>(
    this._budgets$$.get(),
    { initialValue: undefined }
  );
  readonly allBudgets = computed(() => {
    const overview = this.overview();
    const budgets = this.sharedBudgets();
    const flOverview = overview ? __flatMap(overview) : [];
    const flBudgets = budgets ? __flatMap(budgets) : [];
    const trBudgets = flBudgets.map((budget: any) => {
      budget['endYear'] = budget.startYear + budget.duration - 1; return budget;
    });
    return { overview: flOverview, budgets: trBudgets };
  });

  private _orgBudgets$$ = inject(OrgBudgetsStore);
  private _budgets$$ = inject(BudgetsStore);
  private _dialog = inject(MatDialog);
  private _logger = inject(Logger);

  constructor() { }

  ngOnInit() {
    this.overview$ = this._orgBudgets$$.get();
    this.sharedBudgets$ = this._budgets$$.get();

    this.allBudgets$ = combineLatest([this.overview$, this._budgets$$.get()])
                      .pipe(map(([overview, budgets]) => {return {overview: __flatMap(overview), budgets: __flatMap(budgets)}}),
                            map((overview) => {
                              const trBudgets = overview.budgets.map((budget: any) => {budget['endYear'] = budget.startYear + budget.duration - 1; return budget;})
                              // this.budgetsLoaded = true;
                              return {overview: overview.overview, budgets: trBudgets}
                            }));
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    // this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  fieldsFilter(value: (Invoice) => boolean) {    
    // this.filter$$.next(value);
  }

  toogleFilter(value) {
    // this.showFilter = value
  }

  openDialog(parent : Budget | false): void 
  {
    const dialog = this._dialog.open(CreateBudgetModalComponent, {
      height: 'fit-content',
      width: '600px',
      data: parent != null ? parent : false
    });

    dialog.afterClosed().subscribe(() => {
      // Dialog after action
    })
  }

  /** 
   * @TODO - Review and fix
   * Returns true if the budget can be activated */
  canPromote(record: BudgetRecord) {
    // Get's set on Budget Read from user privileges and budget status.
    return (record.budget as any).canBeActivated;
  }

  /** Activate budget -> Promote to be used in  */
  setActive(record: BudgetRecord) 
  {
    const toSave = ___cloneDeep(record.budget);

    // Clean up budget record values.
    delete (toSave as any).canBeActivated;
    delete (toSave as any).access;

    // Set Active
    toSave.status = BudgetStatus.InUse;

    (<any> record).updating = true;
    // Fire update
    this._budgets$$.update(toSave)
      .subscribe(() => {
        (<any> record).updating = false;
        this._logger.log(() => `Updated Budget with id ${toSave.id}. Set as an active budget for this org.`) 
      });
  }
}