import { Link } from 'react-router-dom'
import logoImage from '../../assets/img/logoRestaurante.png'

const heroImage = logoImage
const testimonialsBg =
  'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?auto=format&fit=crop&w=1920&q=80'

export const LandingPage = () => {
  const restaurantTypes = [
    {
      title: 'Comida China',
      description: 'Wok, noodles y sabores orientales auténticos.',
      image:
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Pollo',
      description: 'Pollo crujiente, asado y recetas caseras.',
      image:
        'https://images.unsplash.com/photo-1600891964092-4316c288032e?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Parrilla',
      description: 'Cortes premium y especialidades a la brasa.',
      image:
        'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80'
    },
    {
      title: 'Comida Italiana',
      description: 'Pastas artesanales, pizzas y cocina mediterránea.',
      image:
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80'
    }
  ]

  const testimonials = [
    {
      name: 'Roger Valladares',
      message: 'Rica comida, años degustando su delicioso sabor. Muy recomendado.',
    },
    {
      name: 'Marcos García',
      message: 'Cumple medidas sanitarias, buen sabor y excelente servicio. Parqueo disponible.',
    },
    {
      name: 'Kenny Angel',
      message: 'La atención es muy buena y la comida deliciosa. Ideal para compartir en familia.',
    },
    {
      name: 'Zimri Jahadai',
      message: 'Gran ambientación, atención y platillos orientales. Regresaré cada vez que pueda.',
    },
    {
      name: 'Iosef Suarez',
      message: 'Excelente atención desde que llegamos, porciones generosas y sabor increíble. Volveré con mi familia.',
    },
    {
      name: 'Angel Reyes',
      message: 'Muy buen servicio, ambiente cómodo y comida bien preparada. Lo recomiendo para reuniones y celebraciones.',
    },
  ]

  return (
    <div className="bg-zinc-100 text-white">
      <section className="relative min-h-[120vh]">
        <picture className="absolute inset-0 block h-full w-full bg-black">
          <img
            src={heroImage}
            alt="Platillo principal"
            className="h-full w-full object-contain object-center"
          />
        </picture>

        <div className="absolute inset-0 bg-black/70" />

        <header className="relative z-20">
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-8">
            <Link to="/" className="text-2xl sm:text-3xl font-black tracking-wide text-white">
              WELCOME
            </Link>

            <div className="hidden items-center gap-8 text-sm font-semibold lg:flex">
              <a href="#inicio" className="transition-colors hover:text-red-400">Inicio</a>
              <a href="#restaurantes" className="transition-colors hover:text-red-400">Nuestros Restaurantes</a>
              <a href="#ubicaciones" className="transition-colors hover:text-red-400">Testimonios</a>
              <a href="#nosotros" className="transition-colors hover:text-red-400">Nosotros</a>
            </div>

            <Link
              to="/auth"
              className="rounded-full border border-white/40 bg-white/10 px-4 py-2 text-xs sm:text-sm font-semibold backdrop-blur transition-colors hover:border-red-500 hover:bg-red-600"
            >
              Iniciar sesión
            </Link>
          </nav>
        </header>

        <main id="inicio" className="relative z-10 flex min-h-[120vh] items-center justify-center px-4 text-center">
          <div>
            <h1 className="text-5xl font-black tracking-widest text-red-600 drop-shadow-[0_0_12px_rgba(220,38,38,0.75)] sm:text-7xl">
              WELCOME
            </h1>
            <p className="mt-4 text-xl font-light sm:text-4xl">¡Doblemente Delicioso!</p>
          </div>
        </main>
      </section>

      <section id="restaurantes" className="mx-auto max-w-7xl px-4 py-16 sm:px-8">
        <h2 className="mb-10 text-3xl font-black text-zinc-900 sm:text-4xl">Nuestros Restaurantes</h2>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {restaurantTypes.map((restaurant) => (
            <article
              key={restaurant.title}
              className="group overflow-hidden rounded-2xl bg-white shadow-md transition-all hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="h-52 overflow-hidden">
                <img
                  src={restaurant.image}
                  alt={restaurant.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="p-5 text-zinc-800">
                <h3 className="text-lg font-bold">{restaurant.title}</h3>
                <p className="mt-2 text-sm text-zinc-600">{restaurant.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="ubicaciones" className="relative mt-6 min-h-[70vh]">
        <img
          src={testimonialsBg}
          alt="Testimonios de clientes"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/55" />

        <div className="relative z-10 mx-auto grid max-w-7xl gap-10 px-4 py-16 text-white sm:grid-cols-2 sm:px-8">
          <h2 className="sm:col-span-2 text-3xl font-black">Testimonios</h2>
          {testimonials.map((item) => (
            <article key={item.name} className="max-w-xl">
              <h3 className="text-3xl font-semibold leading-tight">{item.name}</h3>
              <p className="mt-3 text-sm leading-7 text-white/90">{item.message}</p>
            </article>
          ))}
        </div>
      </section>

      <footer id="nosotros" className="bg-zinc-900 text-zinc-200">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-2 sm:px-8">
          <div>
            <h3 className="text-5xl font-black tracking-widest text-white">Fuego y Sabor</h3>
            <p className="mt-6 max-w-xl text-sm leading-7 text-zinc-400">
              Para Restaurantes Fuego y Sabor compartir entre amigos o en familia es uno de los mejores placeres.
              Queremos que cada receta forme parte de tu historia.
            </p>
            <p className="mt-6 text-xs text-zinc-500">2026 Copyrights · Fuego y Sabor Guatemala</p>
          </div>

          <div className="sm:justify-self-end">
            <h4 className="text-2xl font-bold text-white">Visítanos en el siguiente horario:</h4>
            <p className="mt-3 text-sm text-zinc-400">Lu - Do 10:00 a 22:00</p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-zinc-500 text-xl">f</span>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-zinc-500 text-xl">ig</span>
              <span className="inline-flex h-12 min-w-24 items-center justify-center rounded-full bg-red-600 px-4 text-2xl font-black text-white">
                1733
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
