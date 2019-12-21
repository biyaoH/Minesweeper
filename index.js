const view = {

  // 顯示踩地雷的遊戲版圖在畫面上，
  // 輸入的 rows 是指版圖的行列數。
  displayFields(rows) {
    const gameTable = document.querySelector('#game-table');

    gameTable.innerHTML = Array.from(Array(rows * rows).keys()).map(index => this.getGridElement(index)).join("")
  },

  getGridElement(index) {
    return `
      <div id="grid-mine" class="digged-false" data-index="${index}"></div>`
  },

  // 更改單一格子的內容，像是顯示數字、地雷，或是海洋。
  showFieldContent(field) {
    let index = field.dataset.index
    let grid = model.fields[index]

    if (controller.isMine(index) === false && grid.mineAround === 0) {
      return
    } else if (controller.isMine(index) === false) {
      field.innerHTML = `${grid.mineAround}`
    } else {
      field.innerHTML = `<i class="fas fa-bomb"></i>`
      alert('BOMB ! GAME OVER !')
      controller.eventListenerEnd()
    }
  },

  showFlagContent(field) {
    field.innerHTML = `<i class="fas fa-flag"></i>`
  },
  removeFlagContent(field) {
    console.log('removeFlagContent')
    console.log(field.firstElementChild)
    let flag = field.firstElementChild
    flag.remove()

  },
  // 顯示經過的遊戲時間在畫面上。
  renderTime(time) { },


  // 遊戲結束時，或是 debug 時將遊戲的全部格子內容顯示出來。
  showBoard() { }
}

const controller = {
  // 根據參數決定遊戲版圖的行列數，以及地雷的數量，
  //  一定要做的事情有：
  //  1. 顯示遊戲畫面
  //  2. 遊戲計時
  //  3. 埋地雷
  //  4. 綁定事件監聽器到格子上
  createGame(numberOfRows, numberOfMines) {
    view.displayFields(numberOfRows)
    model.numberOfRows.push(parseInt(numberOfRows))
    this.setMinesAndFields(numberOfMines)
    this.eventListenerStart()

  },

  // 設定格子的內容，以及產生地雷的編號。
  setMinesAndFields(numberOfMines) {
    // 產生地雷的編號
    model.mines = utility.getRandomNumberArray(81).splice(0, numberOfMines)
    console.log('controller:setMinesAndFields')
    console.log(model.mines)

    // 設定格子內容
    let dataGrid = {}
    const numberOfRows = model.numberOfRows[0]
    let array = Array.from(Array(numberOfRows * numberOfRows).keys())

    array.forEach(arr => {
      // 地雷格子內容
      if (model.mines.includes(arr)) {
        dataGrid = {
          'x': this.indexToCoordinateColumn(arr),
          'y': this.indexToCoordinateRow(arr),
          'type': 'mine',
          'isDigged': 'false',
          'isFlagged': 'false'
        }

        model.fields.push(dataGrid)
        // 其他格子內容
      } else {
        dataGrid = {
          'x': this.indexToCoordinateRow(arr),
          'y': this.indexToCoordinateColumn(arr),
          'type': 'number',
          'mineAround': 0,
          'isDigged': 'false',
          'isFlagged': 'false'
        }

        model.fields.push(dataGrid)
      }

    })

    this.getFieldData(model.mines)

  },


  // 取得單一格子的內容，決定這個格子是海洋還是號碼，
  // 如果是號碼的話，要算出這個號碼是幾號。
  // （計算周圍地雷的數量）
  getFieldData(fieldIdx) {
    const numberOfRows = model.numberOfRows[0]

    fieldIdx.forEach(mine => {
      // let rowOfMine = this.indexToCoordinateRow(mine)
      // let columnOfMine = this.indexToCoordinateColumn(mine)

      let field = model.fields[mine]

      if (field.x === 1 && field.y === 1) {
        this.ifMineTopLeft(mine)
      } else if (field.x === 1 && field.y === numberOfRows) {

        this.ifMineDownLeft(mine)
      } else if (field.x === numberOfRows && field.y === 1) {
        this.ifMineTopRight(mine)
      } else if (field.x === numberOfRows && field.y === numberOfRows) {
        this.ifMineDownRight(mine)

      } else if (field.y === 1) {
        this.ifMineTop(mine)
      } else if (field.y === numberOfRows) {
        this.ifMineDown(mine)
      } else if (field.x === 1) {
        this.ifMineLeft(mine)
      } else if (field.x === numberOfRows) {
        this.ifMineRight(mine)
      } else {
        this.ifMineInside(mine)
      }
    })

    console.log(model.fields)
  },

  eventListenerStart() {
    let gameTable = document.querySelector('#game-ground')
    document.oncontextmenu = function () {
      return false;
    }
    gameTable.addEventListener('mousedown', controller.digging)
  },

  eventListenerEnd() {
    let gameTable = document.querySelector('#game-ground')
    document.oncontextmenu = function () {
      return false;
    }
    gameTable.removeEventListener('mousedown', controller.digging)
  },


  digging(event) {
    event.preventDefault();
    let index = parseInt(event.target.dataset.index)
    console.log(event.target)

    if (event.button === 2) {

      if (event.target.id === 'grid-mine') {
        if (controller.isFlagged(index) === 'false') {
          view.showFlagContent(event.target)
          model.fields[index].isFlagged = 'true'
        } else if (controller.isFlagged(index) === 'true') {
          model.fields[index].isFlagged = 'false'
          view.removeFlagContent(event.target)
        }
      } else if (event.target.classList.contains('fa-flag') === true) {
        index = event.target.parentElement.dataset.index
        model.fields[index].isFlagged = 'false'
        view.removeFlagContent(event.target.parentElement)
      }

    } else if (event.button === 0) {
      if (event.target.id === 'grid-mine') {
        controller.dig(event.target)
      } else if (event.target.id === 'reset' || event.target.classList.contains('fa-smile') === true) {
        controller.createGame(9, 12)
      } else { return }

    } else {
      return
    }

  },


  // 使用者挖格子時要執行的函式，
  // 會根據挖下的格子內容不同，執行不同的動作，
  // 如果是號碼或海洋 => 顯示格子
  // 如果是地雷      => 遊戲結束
  dig(field) {
    console.log(field)
    let index = field.dataset.index
    let grid = model.fields[index]
    if (grid.isDigged === 'false') {
      // setProperty
      field.classList.remove('digged-false')
      field.classList.add('digged-true')
      // field.setAttribute("class", "bg-secondary");
      view.showFieldContent(field)
      grid.isDigged = 'true'
      if (controller.isWin() === true) {
        alert('YOU WIN !')
        controller.eventListenerEnd()
      }
    } else {
      return
    }
  },

  // ********土法鍊鋼計算迥邊地雷數量*********

  ifMineTopLeft(mine) {
    model.fields[mine + 1].mineAround += 1
    model.fields[mine + model.numberOfRows[0]].mineAround += 1
    model.fields[mine + model.numberOfRows[0] + 1].mineAround += 1
  },

  ifMineTopRight(mine) {
    model.fields[mine - 1].mineAround += 1
    model.fields[mine + model.numberOfRows[0]].mineAround += 1
    model.fields[mine + model.numberOfRows[0] - 1].mineAround += 1
  },

  ifMineDownLeft(mine) {
    model.fields[mine + 1].mineAround += 1
    model.fields[mine - model.numberOfRows[0]].mineAround += 1
    model.fields[mine - model.numberOfRows[0] + 1].mineAround += 1
  },

  ifMineDownRight(mine) {
    model.fields[mine - 1].mineAround += 1
    model.fields[mine - model.numberOfRows[0]].mineAround += 1
    model.fields[mine - model.numberOfRows[0] - 1].mineAround += 1
  },

  ifMineTop(mine) {
    model.fields[mine - 1].mineAround += 1
    model.fields[mine + 1].mineAround += 1
    model.fields[mine + model.numberOfRows[0]].mineAround += 1
    model.fields[mine + model.numberOfRows[0] - 1].mineAround += 1
    model.fields[mine + model.numberOfRows[0] + 1].mineAround += 1
  },

  ifMineDown(mine) {
    model.fields[mine - 1].mineAround += 1
    model.fields[mine + 1].mineAround += 1
    model.fields[mine - model.numberOfRows[0]].mineAround += 1
    model.fields[mine - model.numberOfRows[0] - 1].mineAround += 1
    model.fields[mine - model.numberOfRows[0] + 1].mineAround += 1
  },

  ifMineLeft(mine) {
    let numberOfRows = model.numberOfRows[0]

    model.fields[mine + 1].mineAround += 1
    model.fields[mine - numberOfRows].mineAround += 1
    model.fields[mine - numberOfRows + 1].mineAround += 1
    model.fields[mine + numberOfRows].mineAround += 1
    model.fields[mine + numberOfRows + 1].mineAround += 1


  },

  ifMineRight(mine) {
    let numberOfRows = model.numberOfRows[0]

    model.fields[mine - 1].mineAround += 1
    model.fields[mine - numberOfRows].mineAround += 1
    model.fields[mine - numberOfRows - 1].mineAround += 1
    model.fields[mine + numberOfRows].mineAround += 1
    model.fields[mine + numberOfRows - 1].mineAround += 1
  },

  ifMineInside(mine) {
    let numberOfRows = model.numberOfRows[0]
    model.fields[mine - 1].mineAround += 1
    model.fields[mine + 1].mineAround += 1

    model.fields[mine - numberOfRows].mineAround += 1
    model.fields[mine - numberOfRows - 1].mineAround += 1
    model.fields[mine - numberOfRows + 1].mineAround += 1

    model.fields[mine + numberOfRows].mineAround += 1
    model.fields[mine + numberOfRows - 1].mineAround += 1
    model.fields[mine + numberOfRows + 1].mineAround += 1

  },


  indexToCoordinateRow(index) {
    return Math.floor(index / model.numberOfRows) + 1
  },

  indexToCoordinateColumn(index) {
    return Math.floor(index % model.numberOfRows) + 1
  },

  coordinateToIndex(row, column) {
    return (row - 1) * model.numberOfRows + column - 1
  },

  // **************************************
  isFirstDig() {
    let result = model.fields.filter(field => field.isDigged === 'false')
    if (result.length === model.fields.length) return true
    return false
  },
  isWin() {
    let result = model.fields.filter(field => field.isDigged === 'false')
    if (result.length === model.mines.length) return true
    return false
  },

  // 輸入一個格子編號，並檢查這個編號是否是地雷
  isMine(fieldIdx) {
    return model.mines.includes(Number(fieldIdx))
  },

  isFlagged(fieldIdx) {
    return model.fields[Number(fieldIdx)].isFlagged
  },

  // spreadOcean(field) {

  //   let index = field.dataset.index
  //   let grid = model.fields[index]

  //   let neighborLeft = field.previousElementSibling
  //   let neighborRight = field.nextElementSibling
  //   while (parseInt(grid.mineAround) === 0) {
  //     console.log(controller.coordinateToIndex(grid.x, grid.y))
  //     console.log(field.nextElementSibling)

  //     if (neighborLeft.id === 'grid-mine') controller.dig(neighborLeft)

  //     break

  //   }
  //   while (parseInt(grid.mineAround) === 0) {
  //     if (neighborRight.id === 'grid-mine') controller.dig(neighborRight)
  //     break
  //   }
  // },
}

const model = {

  // 存放地雷的編號（第幾個格子）
  mines: [],

  // 存放格子內容，這裡同學可以自行設計格子的資料型態，
  fields: [],
  /**
   'x'
   'y'
   'type': 'number',
   'mineAround': 0,
   'isDigged': 'false',
   'isFlagged': 'false'
   */

  numberOfRows: [],
}

const utility = {
  /**
   * getRandomNumberArray()
   * 取得一個隨機排列的、範圍從 0 到 count參數 的數字陣列。
   * 例如：
   *   getRandomNumberArray(4)
   *     - [3, 0, 1, 2]
   */
  getRandomNumberArray(count) {
    const number = [...Array(count).keys()]
    for (let index = number.length - 1; index > 0; index--) {
      let randomIndex = Math.floor(Math.random() * (index + 1));
      [number[index], number[randomIndex]] = [number[randomIndex], number[index]]
    }

    return number
  }
}
controller.createGame(9, 12)