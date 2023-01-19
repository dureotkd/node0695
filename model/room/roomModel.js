const Core = require('../core');

class RoomModel extends Core {
  constructor(props) {
    super(props);
    this.core = new Core();

    this.table = 'room';
  }

  getRow() {
    const sql = `SELECT * FROM ${this.table}`;

    const res = this.core.excute({
      database: 'militaryGaeting',
      sql: sql,
      type: 'row',
    });

    return res;
  }

  getRowByPk(seq) {
    const sql = `SELECT * FROM ${this.table} WHERE seq = ${seq}`;

    const res = this.core.excute({
      database: 'militaryGaeting',
      sql: sql,
      type: 'row',
    });

    return res;
  }

  getAll() {
    const sql = `SELECT * FROM ${this.table}`;

    const res = this.core.excute({
      database: 'militaryGaeting',
      sql: sql,
      type: 'all',
    });

    return res;
  }

  async insert(data) {
    const insertSql = this.core.getInsertQuery({
      table: `${this.table}`,
      data: data,
    });

    const lastInsertSeq = await this.core.excute({
      sql: insertSql,
      type: 'exec',
    });

    return lastInsertSeq;
  }

  async update({ data, where = [1] }) {
    const updateSql = this.core.getUpdateQuery({
      table: `${this.table}`,
      data: data,
      where: where,
    });

    const lastInsertSeq = await this.core.excute({
      sql: updateSql,
      type: 'exec',
    });

    return lastInsertSeq;
  }

  test() {
    console.log('test');
  }
}

module.exports = new RoomModel();
