import { Component } from '@angular/core';
import { ModalController, RefresherCustomEvent, InfiniteScrollCustomEvent } from '@ionic/angular';
import { addMonths, set } from 'date-fns';
import { ExpenseModalComponent } from '../expense-modal/expense-modal.component';
import { ExpensesService } from '../expenses.service';
import { Expense, Page } from '../../shared/domain';
import { ToastService } from '../../shared/service/toast.service';
import { finalize } from 'rxjs/operators';

interface ExpenseGroup {
  date: string;
  expenses: Expense[];
}

@Component({
  selector: 'app-expense-overview',
  templateUrl: './expense-list.component.html',
})
export class ExpenseListComponent {
  date = set(new Date(), { date: 1 });
  expenseGroups: ExpenseGroup[] | null = null;
  loading = false;
  lastPageReached = false;

  constructor(
    private readonly modalCtrl: ModalController,
    private readonly expenseService: ExpensesService,
    private readonly toastService: ToastService,
  ) {}

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
    const yearMonth = this.date.toISOString().substr(0, 7);
    this.loading = true;
    this.expenseService
      .getExpenses(yearMonth)
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
            // Wenn `expenses` ein `Page<Expense>`-Objekt ist, können Sie hier entsprechende Logik implementieren
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
    // You need to implement pagination logic here if your API supports it
    // For simplicity, I'm assuming it doesn't support pagination in this example
    this.lastPageReached = true; // Assuming this is the last page
    (event as InfiniteScrollCustomEvent).target.complete();
  }
}
