const { fork } = require('child_process');

class JobMaster {
  constructor(names) {
    this.names = names;
    this.workers = [];
    this.lastJobIndex = -1;
  }

  onWorkerResponse(worker, msg) {
    worker.isBusy = false;
    console.log(`worker ${worker.workerName} responded with`, msg);
  }

  onWorkerClose(worker, code) {
    console.log(`worker ${worker.workerName} closed with`, code);
  }

  initialize() {
    this.workers = this.names.map(name => {
      const worker = fork('jobWorker.js', [name]);
      worker.workerName = name;
      return worker;
    });
    this.workers.forEach(w => {
      w.on('message', msg => this.onWorkerResponse(w, msg));
      w.on('close', code => this.onWorkerClose(w, code));
    });
    // console.log(this);
  }

  stop() {
    console.log('command stream has ended');
    this.workers.forEach(w => w.send({ name: 'stop' }));
  }

  getNextFreeWorker() {
    const freeWorkers = this.workers.filter(w => !w.isBusy);
    return freeWorkers[0];
  }

  runCommand(text) {
    const worker = this.getNextFreeWorker();
    if (!worker) {
      console.log('Everyone is busy, Please try again later');
      return;
    }
    worker.send({ name: 'run', text });
    worker.isBusy = true;
  }
}

const main = function() {
  const workerNames = process.argv.slice(2);
  const master = new JobMaster(workerNames);
  // console.log(master);
  master.initialize();

  process.stdin.setEncoding('utf8');
  process.stdin.on('data', text => master.runCommand(text));
  process.stdin.on('end', () => master.stop());
};

main();
