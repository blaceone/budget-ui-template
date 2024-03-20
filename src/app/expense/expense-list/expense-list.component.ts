import { Component, NgIterable } from '@angular/core';
import { addMonths, set } from 'date-fns';
import { ModalController } from '@ionic/angular';
import { ExpenseModalComponent } from '../expense-modal/expense-modal.component';
import { Expense } from '../../shared/domain';
import * as vm from 'vm';

@Component({
  selector: 'app-expense-overview',
  templateUrl: './expense-list.component.html',
})
export class ExpenseListComponent {
  date = set(new Date(), { date: 1 });

  constructor(private readonly modalCtrl: ModalController) {}

  addMonths = (number: number): void => {
    this.date = addMonths(this.date, number);
  };
  expenses: (NgIterable<unknown> & NgIterable<any>) | undefined | null;

  async openModal(expense?: Expense): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: ExpenseModalComponent,
      componentProps: { expense: expense ? { ...expense } : {} },
    });
    modal.present();
    const { role } = await modal.onWillDismiss();
    console.log('role', role);
  }
}
