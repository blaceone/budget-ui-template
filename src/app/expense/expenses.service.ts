import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Expense, Page } from '../shared/domain'; // Geänderte Importe entsprechend dem Expense-Service
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ExpensesService {
  private readonly apiUrl = `${environment.backendUrl}/expenses`;

  constructor(private readonly httpClient: HttpClient) {}

  // Read

  getExpenses = (
    pagingCriteria: any,
  ): Observable<Page<Expense>> => // Typ von pagingCriteria anpassen, falls nötig
    this.httpClient.get<Page<Expense>>(this.apiUrl, { params: new HttpParams({ fromObject: { ...pagingCriteria } }) });

  // Create & Update

  upsertExpense = (expense: Expense): Observable<void> => this.httpClient.put<void>(this.apiUrl, expense);

  // Delete

  deleteExpense = (id: string): Observable<void> => this.httpClient.delete<void>(`${this.apiUrl}/${id}`);
}
