import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ModalController, RefresherCustomEvent, InfiniteScrollCustomEvent } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { addMonths, set } from 'date-fns';
import { ExpenseModalComponent } from '../expense-modal/expense-modal.component';
import { ExpensesService } from '../expenses.service';
import { Expense, Page } from '../../shared/domain';
import { ToastService } from '../../shared/service/toast.service';

interface ExpenseGroup {
  date: string;
  expenses: Expense[];
}

interface SortOption {
  label: string;
  value: string;
}

@Component({
  selector: 'app-expense-overview',
  templateUrl: './expense-list.component.html',
})
export class ExpenseListComponent implements OnDestroy {
  date = set(new Date(), { date: 1 });
  expenseGroups: ExpenseGroup[] | null = null;
  loading = false;
  lastPageReached = false;
  searchForm: FormGroup;
  sortOptions: SortOption[] = [
    { label: 'Created at (newest first)', value: 'createdAt,desc' },
    { label: 'Created at (oldest first)', value: 'createdAt,asc' },
    { label: 'Name (A-Z)', value: 'name,asc' },
    { label: 'Name (Z-A)', value: 'name,desc' },
  ];
  private searchFormSubscription!: Subscription;

  constructor(
    private readonly modalCtrl: ModalController,
    private readonly expenseService: ExpensesService,
    private readonly toastService: ToastService,
    private readonly formBuilder: FormBuilder,
  ) {
    this.searchForm = this.formBuilder.group({
      name: [],
      sort: [this.sortOptions[0].value], // Default sort option
    });

    this.searchFormSubscription = this.searchForm.valueChanges.subscribe(() => {
      this.loadExpenses();
    });
  }

  ngOnDestroy(): void {
    this.searchFormSubscription.unsubscribe();
  }

  addMonths(number: number): void {
    this.date = addMonths(this.date, number);
    this.loadExpenses();
  }

  async openModal(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: ExpenseModalComponent,
    });
    modal.present();
    const { role } = await modal.onWillDismiss();
    if (role === 'refresh') {
      this.reloadExpenses();
    }
  }

  ionViewDidEnter(): void {
    this.loadExpenses();
  }

  reloadExpenses(event?: any): void {
    this.expenseGroups = null;
    this.lastPageReached = false;
    this.loadExpenses(() => {
      if (event) {
        (event as RefresherCustomEvent).target.complete();
      }
    });
  }

  loadExpenses(completeCallback: () => void = () => {}): void {
    const searchTerm = this.searchForm.get('name')?.value;
    const sortOption = this.searchForm.get('sort')?.value;
    const yearMonth = this.date.toISOString().substr(0, 7);

    this.loading = true;
    this.expenseService
      .getExpenses(yearMonth, searchTerm, sortOption)
      .pipe(
        finalize(() => {
          this.loading = false;
          completeCallback();
        }),
      )
      .subscribe(
        (expenses: Expense[] | Page<Expense>) => {
          if (Array.isArray(expenses)) {
            this.groupExpenses(expenses);
          } else {
            // Handle Page<Expense> object if needed
          }
        },
        (error) => {
          this.toastService.displayErrorToast('Could not load expenses', error);
        },
      );
  }

  groupExpenses(expenses: Expense[]): void {
    const groupedExpenses: { [key: string]: Expense[] } = {};
    expenses.forEach((expense) => {
      const date = expense.date.substr(0, 10); // Extracting date portion
      if (!groupedExpenses[date]) {
        groupedExpenses[date] = [];
      }
      groupedExpenses[date].push(expense);
    });

    this.expenseGroups = Object.keys(groupedExpenses).map((date) => ({
      date,
      expenses: groupedExpenses[date],
    }));
  }

  loadNextExpensesPage(event: any): void {
    // Implement pagination logic if needed
    this.lastPageReached = true; // Assuming this is the last page
    (event as InfiniteScrollCustomEvent).target.complete();
  }
}
