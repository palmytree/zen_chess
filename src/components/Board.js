import React, { Component } from 'react'
import axios from 'axios'
import Square from './Square'
import stBoard from '../assets/data/starting_chess_board.json'

export default class Board extends Component {
	constructor(props) {
		super(props)

		this.state = {
			gid: '',
			fen: '',
			board: JSON.parse(JSON.stringify(stBoard)),
			moves: [], // Record of moves made in current game
			cvm: [], // Current Valid moves
			sideToMove: '', // Side to move
			preMove: false,
			mounted: false,
			selectedSquare: '',
			ssMoves: []
		}
	}

	getGame = () => {
		axios
			.get(`/api/game/${this.props.gid}`)
			.then(res => {
				const {
					fen,
					board,
					pieces,
					moves,
					captures,
					sideToMove,
					cvm,
					status
				} = res.data
				this.setState({
					gid: this.props.gid,
					fen,
					board,
					pieces,
					moves,
					captures,
					status,
					sideToMove,
					cvm,
					mounted: true
				})
			})
			.catch(err => console.log(err))
	}

	preMoveToggle = e => {
		const { preMove: pm, selectedSquare: ss, cvm } = this.state
		this.setState({
			preMove: !pm,
			selectedSquare: ss ? '' : e.target.id,
			ssMoves: ss ? [] : cvm.filter(e => e.from === ss)
		})
		this.props.daddyPNToggle()
	}

	makeMove = e => {
		const from = this.state.selectedSquare

		this.props.daddyPNToggle()
		this.state.pieceMove.play()
		const moveIndex = this.state.cvm.findIndex(
			mv => mv.from === from && mv.to === e.target.id
		)
		const move = { move: this.state.cvm[moveIndex] }
		axios
			.put(`/api/game/move/${this.props.gid}`, move)
			.then(res => {
				const {
					fen,
					board,
					moves,
					captures,
					sideToMove,
					cvm,
					status,
					outcome
				} = res.data
				this.setState({
					fen,
					board,
					moves,
					captures,
					status,
					sideToMove,
					cvm,
					preMove: false,
					selectedSquare: ''
				})
				if (status !== '' && status !== 'check') this.props.gameOverToggle()
				this.props.updateStatus(status, outcome, sideToMove)
				this.props.rotateBoard()
			})
			.catch(err => console.table(err))
	}

	componentDidMount() {
		this.getGame()
		const pieceMove = document.querySelector('#piece-move')
		this.setState({ pieceMove })
	}

	render() {
		// console.table(imgs)
		// console.log(this.state)
		const { rotation, dark, light, status } = this.props
		const { preMove, board, cvm, selectedSquare: ss, gid } = this.state
		if (gid !== this.props.gid) {
			this.getGame()
		}
		return (
			<div
				id='chess-board'
				className={`Board flex ${rotation} ${
					status !== '' && status !== 'check' ? 'blur' : ''
				} ${status === 'check' ? 'check' : ''}`}>
				<audio src='assets/sounds/piecemove.ogg' id='piece-move'></audio>
				{!this.state.mounted
					? ''
					: board.map(sq => {
							let validToSquare = cvm.some(
								e => e.from === ss && e.to === sq.square
							)
							let validFromSquare = cvm.some(e => e.from === sq.square)
							return (
								<Square
									key={sq.square}
									action={
										sq.cvm.length && !preMove
											? this.preMoveToggle
											: preMove && validToSquare
											? this.makeMove
											: validFromSquare
											? this.preMoveToggle
											: preMove
											? this.preMoveToggle
											: null
									}
									rotation={rotation}
									piece={sq.cP}
									color={sq.color === 'light' ? light : dark}
									square={sq.square}
									marker={rotation === 'rotW' ? sq.rotW : sq.rotB}
									pms={
										preMove && validToSquare
											? 'move'
											: ss === sq.square
											? 'selected'
											: preMove && !validToSquare
											? 'not-move'
											: validFromSquare
											? ''
											: 'invalid'
									} // Pre-move style
								/>
							)
					  })}
			</div>
		)
	}
}
