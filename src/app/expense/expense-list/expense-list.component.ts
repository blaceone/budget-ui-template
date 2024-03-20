import { Component, NgIterable } from '@angular/core';
import { addMonths, set } from 'date-fns';
import { ModalController } from '@ionic/angular';
import { Category, Expense } from '../../shared/domain';
import { CategoryModalComponent } from '../../category/category-modal/category-modal.component';
import { ExpenseModalComponent } from '../expense-modal/expense-modal.component';

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

  async openModal(category?: Category): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: ExpenseModalComponent,
      componentProps: { category: category ? { ...category } : {} },
    });
    modal.present();
    const { role } = await modal.onWillDismiss();
    if (role === 'refresh') this.reloadCategories();
  }

  private reloadCategories() {}

  showCategoryModal() {}
}
