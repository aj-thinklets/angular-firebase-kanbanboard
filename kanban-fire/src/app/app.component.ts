import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Component } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject } from 'rxjs';
import { TaskDialogComponent, TaskDialogResult } from './task-dialog/task-dialog.component';
import { Task } from './task/task';



// Wrap into a BehaviorSubject so that we don't create a new
// underlying array every time. This way the reorder method
// of the CDK drag & drop would work since it'll operate
// over the same array reference that we use to render the lists.
const getObservable = (collection: AngularFirestoreCollection<Task>) => {
  const subject = new BehaviorSubject([]);
  collection.valueChanges({ idField: 'id' }).subscribe((val: Task[]) => {
    subject.next(val);
  });
  return subject;
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  // todo: Task[] = [
  //   { title: 'Buy milk', description: 'Go to store and buy milk' },
  //   { title: 'Create a Kanban Board', description: 'Go to store and buy milk' },
  // ]
  // inProgress: Task[] = [];
  // done: Task[] = [];

  // todo = this.store.collection('todo').valueChanges({ idField: 'id' });
  // inProgress = this.store.collection('inProgress').valueChanges({ idField: 'id' });
  // done = this.store.collection('done').valueChanges({ idField: 'id' });

  todo = getObservable(this.store.collection('todo'))
  inProgress = getObservable(this.store.collection('inProgress'));
  done = getObservable(this.store.collection('done'));


  constructor(private dialog: MatDialog, private store: AngularFirestore) { }


  //working with observable and firestore
  drop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) {
      const item = event.previousContainer.data[event.previousIndex];
      console.log("item: ", item, item.id);
      console.log("event.previousContainer.id", event.previousContainer.id);
      console.log("item.id", item.id);
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    }
    else {
      const item = event.previousContainer.data[event.previousIndex];
      console.log("item: ", item, item.id);
      console.log("event.previousContainer.id", event.previousContainer.id);
      console.log("item.id", item.id);

      this.store.firestore.runTransaction(() => {
        return Promise.all([
          this.store.collection(event.previousContainer.id).doc(item.id).delete(),
          this.store.collection(event.container.id).add(item)
        ])
      });
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
  }

  //working with observable and firestore
  edit(list: 'done' | 'todo' | 'inProgress', task: Task): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '270px',
      data: {
        task,
        enableDelete: true
      }
    });
    dialogRef
      .afterClosed().subscribe((result: TaskDialogResult) => {
        if (result.delete) {
          this.store.collection(list).doc(task.id).delete();
        } else {

          this.store.collection(list).doc(task.id).update(task);
        }
      })
  }

  //working with observable and firestore
  newTask() {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '270px',
      data: {
        task: {}
      }
    });
    dialogRef
      .afterClosed()
      .subscribe((result: TaskDialogResult) => this.store.collection('todo').add(result.task));
  }

  //Normal Array Function w/o firebase local store
  // drop(event: CdkDragDrop<Task[]>): void {
  //   if (event.previousContainer === event.container) return;
  //   transferArrayItem(
  //     event.previousContainer.data,
  //     event.container.data,
  //     event.previousIndex,
  //     event.currentIndex
  //   );
  // }


  //Edit with local store
  // edit(list: 'done' | 'todo' | 'inProgress', task: Task): void {
  //   const dialogRef = this.dialog.open(TaskDialogComponent, {
  //     width: '270px',
  //     data: {
  //       task,
  //       enableDelete: true
  //     }
  //   });
  //   dialogRef
  //     .afterClosed().subscribe((result: TaskDialogResult) => {
  //       const dataList = this[list];
  //       const taskIndex = dataList.indexOf(task);
  //       if (result.delete) {
  //         dataList.splice(taskIndex, 1);
  //       }
  //       else {
  //         dataList[taskIndex] = task;
  //       }
  //     })
  // }

  // newTask() {
  //   const dialogRef = this.dialog.open(TaskDialogComponent, {
  //     width: '270px',
  //     data: {
  //       task: {}
  //     }
  //   });
  //   dialogRef
  //     .afterClosed()
  //     .subscribe((result: TaskDialogResult) => this.todo.push(result.task));
  // }
}

