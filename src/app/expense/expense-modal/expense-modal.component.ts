import { Component } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ActionSheetService } from '../../shared/service/action-sheet.service';
import { Category } from '../../shared/domain';
import { ExpensesService } from '../expenses.service';
import { ToastService } from '../../shared/service/toast.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { formatISO, parseISO } from 'date-fns';
import { CategoryModalComponent } from '../../category/category-modal/category-modal.component';

@Component({
  selector: 'app-expense-modal',
  templateUrl: './expense-modal.component.html',
})
export class ExpenseModalComponent {
  expenseForm: FormGroup;
  submitting: boolean = false;
  categories: Category[] = [
    { id: '1', name: 'Food' },
    { id: '2', name: 'Transport' },
    { id: '3', name: 'Shopping' },
  ];
  expense: any; // Die zu bearbeitende Ausgabe

  constructor(
    private readonly actionSheetService: ActionSheetService,
    private readonly modalCtrl: ModalController,
    private readonly formBuilder: FormBuilder,
    private readonly expenseService: ExpensesService,
    private readonly toastService: ToastService,
  ) {
    this.expenseForm = this.formBuilder.group({
      id: [null], // ID der Ausgabe für den Bearbeitungsmodus
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

  async deleteExpense(): Promise<void> {
    const confirmed = await this.actionSheetService.showDeletionConfirmation(
      'Are you sure you want to delete this expense?',
    );
    if (confirmed === 'delete' && this.expenseForm.value.id) {
      try {
        await this.expenseService.deleteExpense(this.expenseForm.value.id);
        this.toastService.displaySuccessToast('Expense deleted successfully');
        this.modalCtrl.dismiss(null, 'delete');
      } catch (error) {
        this.toastService.displayErrorToast('Failed to delete expense', error);
      }
    }
  }

  async showCategoryModal(): Promise<void> {
    const categoryModal = await this.modalCtrl.create({ component: CategoryModalComponent });
    categoryModal.present();
    const { role } = await categoryModal.onWillDismiss();
    console.log('role', role);
  }

  ionViewWillEnter(): void {
    // Hier kannst du bei Bedarf die Kategorien aus einer API laden
  }

  // Funktion zum Öffnen des Modals im Bearbeitungsmodus
  async editExpense(expense: any): Promise<void> {
    this.expense = expense; // Setze die aktuelle Ausgabe zum Bearbeiten
    const { id, name, category, amount, date } = expense;
    this.expenseForm.patchValue({
      id,
      name,
      category: category?.id, // Setze die Kategorie-ID für das FormControl
      amount,
      date: formatISO(parseISO(date)), // Datum formatieren
    });
    const modal = await this.modalCtrl.create({ component: ExpenseModalComponent });
    modal.present();
  }
}
