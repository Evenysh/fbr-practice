import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";

const typeDefs = `#graphql
  type Author {
    id: ID!
    name: String!
    books: [Book!]!
  }

  type Book {
    id: ID!
    title: String!
    author: Author!
  }

  type Query {
    books: [Book!]!
    book(id: ID!): Book
    authors: [Author!]!
  }

  type Mutation {
    createAuthor(name: String!): Author!
    createBook(title: String!, authorId: ID!): Book!
  }
`;

const authors = [
  { id: "1", name: "Лев Толстой" },
  { id: "2", name: "Фёдор Достоевский" },
];

const books = [
  { id: "1", title: "Война и мир", authorId: "1" },
  { id: "2", title: "Анна Каренина", authorId: "1" },
  { id: "3", title: "Преступление и наказание", authorId: "2" },
];

const resolvers = {
  Query: {
    books: () => books,
    book: (_, { id }) => books.find((b) => b.id === id),
    authors: () => authors,
  },
  Mutation: {
    createAuthor: (_, { name }) => {
      const author = { id: String(authors.length + 1), name };
      authors.push(author);
      return author;
    },
    createBook: (_, { title, authorId }) => {
      const book = { id: String(books.length + 1), title, authorId };
      books.push(book);
      return book;
    },
  },
  Author: {
    books: (parent) => books.filter((b) => b.authorId === parent.id),
  },
  Book: {
    author: (parent) => authors.find((a) => a.id === parent.authorId),
  },
};

const server = new ApolloServer({ typeDefs, resolvers });

const { url } = await startStandaloneServer(server, {
  listen: { port: 4000 },
});

console.log(`GraphQL Server ready at: ${url}`);
