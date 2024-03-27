import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { filter, from } from 'rxjs';
import { CategoryModalComponent } from '../../category/category-modal/category-modal.component';
import { ActionSheetService } from '../../shared/service/action-sheet.service';
import { Category } from '../../shared/domain';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ExpensesService } from '../expenses.service';
import { ToastService } from '../../shared/service/toast.service';
import { formatISO, parseISO } from 'date-fns';

@Component({
  selector: 'app-expense-modal',
  templateUrl: './expense-modal.component.html',
})
export class ExpenseModalComponent {
  expenseForm: FormGroup;
  submitting: boolean = false;
  categories: Category[] = [];
  private categoryService: any;
  expenseName: any;
  selectedCategory: any;
  expenseAmount: any;
  selectedDate: any;

  constructor(
    private readonly actionSheetService: ActionSheetService,
    private readonly modalCtrl: ModalController,
    private readonly formBuilder: FormBuilder,
    private readonly expenseService: ExpensesService,
    private readonly toastService: ToastService,
  ) {
    this.expenseForm = this.formBuilder.group({
      name: ['', Validators.required],
      category: [null],
      amount: ['', [Validators.required, Validators.min(0)]],
      date: [formatISO(new Date()), Validators.required],
    });
  }

  cancel(): void {
    this.modalCtrl.dismiss(null, 'cancel');
  }

  async save(): Promise<void> {
    if (this.expenseForm.valid && !this.submitting) {
      this.submitting = true;
      try {
        await this.expenseService.upsertExpense({
          ...this.expenseForm.value,
          date: formatISO(parseISO(this.expenseForm.value.date), { representation: 'date' }),
        });
        this.toastService.displaySuccessToast('Expense saved successfully');
        this.modalCtrl.dismiss(null, 'save');
      } catch (error) {
        this.toastService.displayErrorToast('Failed to save expense', error);
      } finally {
        this.submitting = false;
      }
    }
  }

  delete(): void {
    from(this.actionSheetService.showDeletionConfirmation('Are you sure you want to delete this expense?'))
      .pipe(filter((action) => action === 'delete'))
      .subscribe(() => this.modalCtrl.dismiss(null, 'delete'));
  }

  async showCategoryModal(): Promise<void> {
    const categoryModal = await this.modalCtrl.create({ component: CategoryModalComponent });
    categoryModal.present();
    const { role } = await categoryModal.onWillDismiss();
    console.log('role', role);
  }

  ionViewWillEnter(): void {
    this.loadAllCategories();
  }

  private loadAllCategories(): void {
    this.categoryService.getAllCategories({ sort: 'name,asc' }).subscribe({
      next: (categories: Category[]) => (this.categories = categories),
      error: (error: any) => this.toastService.displayErrorToast('Could not load categories', error),
    });
  }
}
