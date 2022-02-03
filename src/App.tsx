import {gql, useMutation, useQuery} from "@apollo/client";
import {useState} from "react";

const GET_TODOS = gql`
    query GetTodos {
        todos {
            id
            done
            text
        }
    }
`

const TOGGLE_TODO = gql`
    mutation toggleTodo($id: uuid!, $done: Boolean!) {
        update_todos(where: {id: {_eq: $id}}, _set: {done: $done}) {
            returning {
                done
                id
                text
            }
        }
    }
`

const DELETE_TODO = gql`
    mutation deleteTodo($id: uuid!) {
        delete_todos(where: {id: {_eq: $id}}) {
            returning {
                id
            }
        }
    }
`

const ADD_TODO = gql`
    mutation addTodos($text: String!) {
        insert_todos(objects: {text: $text}) {
            returning {
                done
                id
                text
            }
        }
    }
`

function App() {
    const [todoText, setTodoText] = useState('')
    const {loading, error, data} = useQuery(GET_TODOS)
    const [toggleTodo] = useMutation(TOGGLE_TODO)
    const [addTodo] = useMutation(ADD_TODO, {
        onCompleted: () => setTodoText('')
    })
    const [deleteTodo] = useMutation(DELETE_TODO)

    if (loading) return <p>Loading...</p>;
    if (error) return <div><p><span>💩</span> Error fetching todos!</p></div>;

    const handleToggleTodo = async (id: number, done: boolean) => {
        const updatedData = await toggleTodo({variables: {id: id, done: !done}})
        console.log('toggle todo', updatedData)
    }

    const handleAddTodo = async (event: any) => {
        event.preventDefault()
        if (!todoText.trim()) return
        const updatedData = await addTodo({variables: {text: todoText}})
        console.log('added todo', updatedData)
    }

    const handleDeleteTodo = async (id: number) => {
        const isConfirmed = window.confirm('Do you want to delete this todo?')
        if (isConfirmed) {
            const deletedData = await deleteTodo({
                variables: {id: id}, update: cache => {
                    const prevData = cache.readQuery({query: GET_TODOS})
                    // @ts-ignore
                    const newTodos = prevData.todos.filter((todo: { id: number; }) => todo.id !== id)
                    cache.writeQuery({query: GET_TODOS, data: {todos: newTodos}})
                }
            })
            console.log(deletedData)
        }
    }

    return (
        <div className="vh-100 code flex flex-column items-center bg-purple white pa3 fl-1">
            <h1 className="f2-l">GraphQL Checklist{" "}
                <span role="img" aria-label="Checkmark">✅</span>
            </h1>
            {/* To do Form */}
            <form className="mb3" onSubmit={handleAddTodo}>
                <input
                    className="pa2 f4 b--dashed"
                    type="text"
                    placeholder="Write your todo"
                    onChange={event => setTodoText(event.target.value)}
                    value={todoText}
                />
                <button className="pa2 f4 bg-green" type="submit">Create</button>
            </form>
            {/* To do List */}
            <ul className="list flex items-center justify-center flex-column">
                {
                    // @ts-ignore
                    data?.todos && data.todos.map(({id, text, done}) => {
                        const doneStyle = done && `strike`
                        return (<li className="pa3" key={id} onDoubleClick={() => handleToggleTodo(id, done)}>
                            <span className={`pointer pa1 f3 ${doneStyle}`}>{text}</span>
                            <button className="bg-transparent bn f4" onClick={() => handleDeleteTodo(id)}>
                                <span className="red">&times;</span>
                            </button>
                        </li>)
                    })
                }
            </ul>
        </div>);
}


export default App;
