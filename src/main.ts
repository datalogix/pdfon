import 'virtual:uno.css'
import '@unocss/reset/tailwind.css'
import './styles/index.scss'

import { Pdfon } from '.'

const books = [
  {
    id: '1',
    name: 'Creators 1',
    src: './books/805769_CREATORS 1_AB_miolo.pdf',
    cover: './books/805769_CREATORS 1_AB_miolo.jpg',
    pages: 65,
    isbn: '978-65-5752-055-0',
    author: 'Silene Cardoso',
    interactions: async () => {
      await new Promise(resolve => setTimeout(resolve, 10000))

      return [
        {
          x: 100,
          y: 100,
          type: 'image',
          content: './books/image.jpg',
          completed: false,
          id: 1,
          page: 1,
          title: 'Imagem 1',
        },
        {
          x: 100,
          y: 200,
          type: 'audio',
          content: './books/audio.mp3',
          completed: false,
          id: 2,
          page: 1,
          title: 'Áudio 1',
        },
        {
          x: 100,
          y: 300,
          type: 'video',
          content: './books/video.mp4',
          completed: false,
          id: 3,
          page: 1,
          title: 'Vídeo 1',
        },
      ]
    },
    resources: [
      {
        name: 'Teste1',
        src: 'a.ppt',
      },
      {
        name: 'Teste2',
        items: [
          {
            name: 'Teste2.1',
            src: 'b.rar',
          },
          {
            name: 'Teste2.2',
            items: [
              {
                name: 'Teste2.3',
                src: 'c.doc',
              },
            ],
          },
          {
            name: 'Teste2.3',
            items: [],
          },
        ],
      },
      {
        name: 'Teste2',
        items: [
          {
            name: 'Teste2.1',
            src: 'b.ttxt',
          },
          {
            name: 'Teste2.2',
            items: [
              {
                name: 'Teste2.3',
                src: 'c.zip',
              },
            ],
          },
          {
            name: 'Teste2.3',
            items: [],
          },
        ],
      },
      {
        name: 'Teste2',
        items: [
          {
            name: 'Teste2.1',
            src: 'b',
          },
          {
            name: 'Teste2.2',
            items: [
              {
                name: 'Teste2.3',
                src: 'c',
              },
            ],
          },
          {
            name: 'Teste2.3',
            items: [],
          },
        ],
      },
      {
        name: 'Teste2',
        items: [
          {
            name: 'Teste2.1',
            src: 'b',
          },
          {
            name: 'Teste2.2',
            items: [
              {
                name: 'Teste2.3',
                src: 'c',
              },
            ],
          },
          {
            name: 'Teste2.3',
            items: [],
          },
        ],
      },
      {
        name: 'Teste2',
        items: [
          {
            name: 'Teste2.1',
            src: 'b',
          },
          {
            name: 'Teste2.2',
            items: [
              {
                name: 'Teste2.3',
                src: 'c',
              },
            ],
          },
          {
            name: 'Teste2.3',
            items: [],
          },
        ],
      },
      {
        name: 'Teste2',
        items: [
          {
            name: 'Teste2.1',
            src: 'b',
          },
          {
            name: 'Teste2.2',
            items: [
              {
                name: 'Teste2.3',
                src: 'c.ppt',
              },
            ],
          },
          {
            name: 'Teste2.3',
            items: [],
          },
        ],
      },
    ],
  },
  {
    id: '2',
    name: 'Innovators 1',
    src: './books/805788_Innovators1 _Arts & Music Book_miolo.pdf',
    cover: './books/805788_Innovators1 _Arts & Music Book_miolo.jpg',
    pages: 65,
    isbn: '978-65-5752-065-9',
    author: 'Vários autores',
  },
  {
    id: '3',
    name: 'Globalizers 1',
    src: './books/810987_GLOBALIZERS 1_SB_Miolo.pdf',
    cover: './books/810987_GLOBALIZERS 1_SB_Miolo.jpg',
    pages: 113,
    isbn: '978-65-5752-253-0',
    author: 'Emma Heyderman, Fiona Mauchline, Olivia Johnston, Patricia Reilly and Patrick Howarth',
  },
  {
    id: '4',
    name: 'Ground breakers 1',
    src: './books/811003_Groundbreakers 1_miolo.pdf',
    cover: './books/811003_Groundbreakers 1_miolo.jpg',
    pages: 153,
    isbn: '978-65-5752-244-0',
    author: 'Louis Rogers, Ben Goldstein',
  },
];

(async () => {
  const pdfon = new Pdfon()
  const viewer = await pdfon.render({
    plugins: {
      library: {
        books,
        bookId: 1,
      },
    },
  })

  viewer.openDocument('./_file.pdf')
  // viewer.openDocument('./books/805769_CREATORS 1_AB_miolo.pdf')
})()
