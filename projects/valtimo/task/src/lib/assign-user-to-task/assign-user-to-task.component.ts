/*
 * Copyright 2015-2023 Ritense BV, the Netherlands.
 *
 * Licensed under EUPL, Version 1.2 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import {DropdownItem} from '@valtimo/components';
import {User} from '@valtimo/config';
import {BehaviorSubject, combineLatest, Subscription, take, tap} from 'rxjs';
import {TaskService} from '../task.service';

@Component({
  selector: 'valtimo-assign-user-to-task',
  templateUrl: './assign-user-to-task.component.html',
  styleUrls: ['./assign-user-to-task.component.scss'],
})
export class AssignUserToTaskComponent implements OnInit, OnChanges, OnDestroy {
  @Input() taskId: string;
  @Input() assigneeEmail: string;
  @Output() assignmentOfTaskChanged = new EventEmitter();

  public assignedEmailOnServer$ = new BehaviorSubject<string | null>(null);
  public assignedUserFullName$ = new BehaviorSubject<string | null>(null);
  public candidateUsersForTask$ = new BehaviorSubject<User[] | undefined>(undefined);
  public disabled$ = new BehaviorSubject<boolean>(true);
  public userEmailToAssign: string | null = null;
  private _subscriptions = new Subscription();

  constructor(private taskService: TaskService) {}

  public ngOnInit(): void {
    this._subscriptions.add(
      this.taskService.getCandidateUsers(this.taskId).subscribe(candidateUsers => {
        this.candidateUsersForTask$.next(candidateUsers);
        if (this.assigneeEmail) {
          this.assignedEmailOnServer$.next(this.assigneeEmail);
          this.userEmailToAssign = this.assigneeEmail;
          this.assignedUserFullName$.next(
            this.getAssignedUserName(candidateUsers, this.assigneeEmail)
          );
        }
        this.enable();
      })
    );
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this.candidateUsersForTask$.pipe(take(1)).subscribe(candidateUsers => {
      const currentUserEmail = changes.assigneeEmail?.currentValue || this.assigneeEmail;
      this.assignedEmailOnServer$.next(currentUserEmail || null);
      this.userEmailToAssign = currentUserEmail || null;
      this.assignedUserFullName$.next(
        this.getAssignedUserName(candidateUsers ?? [], currentUserEmail)
      );
    });
  }

  public ngOnDestroy(): void {
    this._subscriptions.unsubscribe();
  }

  public assignTask(userEmail: string): void {
    this.disable();
    combineLatest([
      this.candidateUsersForTask$,
      this.taskService.assignTask(this.taskId, {assignee: userEmail}),
    ])
      .pipe(
        take(1),
        tap(([candidateUsers]) => {
          this.userEmailToAssign = userEmail;
          this.assignedEmailOnServer$.next(userEmail);
          this.assignedUserFullName$.next(
            this.getAssignedUserName(candidateUsers ?? [], userEmail)
          );
          this.emitChange();
          this.enable();
        })
      )
      .subscribe();
  }

  public unassignTask(): void {
    this.disable();
    this.taskService
      .unassignTask(this.taskId)
      .pipe(
        tap(() => {
          this.clear();
          this.emitChange();
          this.enable();
        })
      )
      .subscribe();
  }

  public getAssignedUserName(users: User[], userEmail: string): string {
    if (users && userEmail) {
      const findUser = users.find(user => user.email === userEmail);
      return findUser ? findUser.fullName || userEmail : userEmail;
    }
    return userEmail || '-';
  }

  public mapUsersForDropdown(users: User[]): DropdownItem[] {
    return (
      users &&
      users
        .map(user => ({...user, lastName: user.lastName?.split(' ').splice(-1)[0] || ''}))
        .sort((a, b) => a.lastName.localeCompare(b.lastName))
        .map(user => ({text: user.fullName || user.email, id: user.email}))
    );
  }

  private clear(): void {
    this.assignedEmailOnServer$.next(null);
    this.userEmailToAssign = null;
  }

  private emitChange(): void {
    this.assignmentOfTaskChanged.emit();
  }

  private enable(): void {
    this.disabled$.next(false);
  }

  private disable(): void {
    this.disabled$.next(true);
  }
}
