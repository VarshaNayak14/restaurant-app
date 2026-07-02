import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Award, Users, Star, ArrowRight, Clock } from 'lucide-react'
import './About.css'

const team = [
  { name:'Chef Arjun Mehta', role:'Founder & Head Chef', image:'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=400&h=400&fit=crop&q=80', bio:'28 years of mastering authentic Indian flavours' },
  { name:'Priya Sharma',     role:'Pastry & Desserts Chef', image:'https://images.unsplash.com/photo-1595257841889-eca2678454e2?w=400&h=500&fit=crop&q=80', bio:'Creating signature Indian sweets since 2005' },
  { name:'Rahul Kapoor',    role:'Tandoor Specialist', image:'https://images.unsplash.com/photo-1566554273541-37a9ca77b91f?w=400&h=500&fit=crop&q=80', bio:'Expert in clay oven techniques & breads' },
]

const timeline = [
  { year:'1995', title:'Founded', desc:'Chef Arjun opens a small kitchen in South Mumbai with 6 tables and a dream.' },
  { year:'2001', title:'First Award', desc:'Named "Best Neighbourhood Restaurant" by Maharashtra Food Guide.' },
  { year:'2008', title:'Expansion', desc:'Moved to our current 120-seat flagship location in Bandra.' },
  { year:'2015', title:'National Fame', desc:'Featured on Times Food Guide, Condé Nast Traveller & NDTV Food.' },
  { year:'2020', title:'Online Launch', desc:'Launched delivery during the pandemic — 10,000 orders in first month.' },
  { year:'2024', title:'Today', desc:'Serving 50,000+ guests per year, award-winning, and still family-run.' },
]

/* Animated number counter */
function Counter({ target, suffix = '' }) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      let start = 0
      const num = parseInt(target)
      const step = () => {
        start += Math.max(1, Math.ceil(num / 50))
        if (start >= num) { setVal(num); return }
        setVal(start); requestAnimationFrame(step)
      }
      requestAnimationFrame(step)
    }, { threshold: .4 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [target])
  return <span ref={ref}>{val}{suffix}</span>
}

/* Generic scroll-reveal wrapper */
function Reveal({ children, className = '', delay = 0, as: Tag = 'div' }) {
  const [visible, setVisible] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect() }
    }, { threshold: .15 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return (
    <Tag ref={ref} className={`reveal ${visible ? 'reveal-in' : ''} ${className}`} style={{ transitionDelay: `${delay}s` }}>
      {children}
    </Tag>
  )
}

export default function About() {
  const [bannerLoaded, setBannerLoaded] = useState(false)
  useEffect(() => { setTimeout(() => setBannerLoaded(true), 100) }, [])

  return (
    <div className="page-wrapper about-page">

      {/* Banner */}
      <div className="about-banner">
        <div className="about-banner-overlay"/>
        <div className="about-banner-particles">
          {Array.from({length:8}).map((_,i) => <span key={i} className="ab-particle" style={{left:`${10+i*11}%`, animationDelay:`${i*0.4}s`}}/>)}
        </div>
        <div className={`about-banner-text ${bannerLoaded ? 'in' : ''}`}>
          <h1>About <span>Spice Garden</span></h1>
          <p>Family-run, award-winning, and deeply passionate since 1995</p>
        </div>
      </div>

      {/* Mission */}
      <section className="section mission-section">
        <div className="container mission-grid">
          <Reveal className="mission-img" as="div">
            <div className="mission-img-stack">
              <div className="mission-img-main">
                <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQcgUH12CiaxLaxmN60La96gPbVxZY88RqnMfk6CFHTXCyocBPTmp6RVXk&s=10" alt="Chef cooking"/>
              </div>
              <div className="mission-img-float mission-img-tr">
                <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=300&h=220&fit=crop&q=85" alt="Restaurant ambience"/>
                <div className="mission-img-float-label">Est. 1995</div>
              </div>
              <div className="mission-img-float mission-img-bl">
                <img src="https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=300&h=220&fit=crop&q=85" alt="Signature dish"/>
                <div className="mission-img-float-label">50K+ Guests</div>
              </div>
              <div className="mission-img-badge">
                <span className="mission-img-badge-num">28</span>
                <span className="mission-img-badge-text">Years of Legacy</span>
              </div>
            </div>
          </Reveal>
          <Reveal className="mission-content" delay={0.15}>
            <span className="section-eyebrow"><Award size={13}/> Our Philosophy</span>
            <h2 className="section-title">Rooted in <span>Tradition</span></h2>
            <div className="gold-line"/>
            <p>Every plate at Spice Garden tells a story — a story of handpicked spices from Kerala markets, of slow-cooked gravies that simmer for hours, of tandoors that never go cold. We believe great food is an act of love, not just a product.</p>
            <p style={{marginTop:'1rem'}}>We source 80% of our vegetables from partner farms within 50km of Mumbai, and we use zero artificial colours or preservatives in anything we serve.</p>
            <div className="mission-stats">
              {[{icon:<Award size={18}/>,val:3,suf:'×',label:'National Award'},{icon:<Users size={18}/>,val:50,suf:'K+',label:'Yearly Guests'},{icon:<Clock size={18}/>,val:28,suf:'',label:'Years Running'}].map((s,i)=>(
                <div key={i} className="mstat" style={{animationDelay:`${i*0.12}s`}}>
                  <div className="mstat-icon">{s.icon}</div>
                  <div className="mstat-val"><Counter target={s.val} suffix={s.suf}/></div>
                  <div className="mstat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Timeline */}
      <section className="section timeline-section">
  <div className="timeline-bg-particles">
    {Array.from({length:5}).map((_,i) => (
      <span key={`smoke-${i}`} className="tl-smoke" style={{left:`${10+i*20}%`, animationDelay:`${i*2}s`, animationDuration:`${10+i}s`}}/>
    ))}
    {Array.from({length:16}).map((_,i) => (
      <span key={`ember-${i}`} className="tl-ember" style={{left:`${(i*6.3)%100}%`, animationDelay:`${i*0.5}s`, animationDuration:`${7+(i%5)}s`}}/>
    ))}
  </div>
        <div className="container">
          <Reveal className="section-header center">
            <span className="section-eyebrow"><Clock size={13}/> Our Journey</span>
            <h2 className="section-title">28 Years of <span>Excellence</span></h2>
            <div className="gold-line center"/>
          </Reveal>
          <div className="timeline">
            <div className="timeline-line-fill"/>
            {timeline.map((t,i) => (
              <Reveal key={i} as="div" className={`tl-item ${i%2===0?'left':'right'}`} delay={i*0.08}>
                <div className="tl-content">
                  <span className="tl-year">{t.year}</span>
                  <h3>{t.title}</h3>
                  <p>{t.desc}</p>
                </div>
                <div className="tl-dot"/>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section team-section">
        <div className="container">
          <Reveal className="section-header center">
            <span className="section-eyebrow"><Users size={13}/> The Team</span>
            <h2 className="section-title">Meet the <span>Chefs</span></h2>
            <div className="gold-line center"/>
          </Reveal>
          <div className="team-grid">
            {team.map((m,i) => (
              <Reveal key={i} className="team-card" delay={i*0.12}>
                <div className="team-img-wrap"><img src={m.image} alt={m.name}/></div>
                <h3>{m.name}</h3>
                <span className="team-role">{m.role}</span>
                <p>{m.bio}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <Reveal as="section" className="about-cta">
        <h2>Come Dine with Us</h2>
        <p>Book a table or order online — we'll bring the soul of India to you.</p>
        <div style={{display:'flex',gap:'16px',justifyContent:'center',flexWrap:'wrap'}}>
          <Link to="/menu"    className="btn-primary">Order Now <ArrowRight size={15}/></Link>
          <Link to="/contact" className="btn-white">Reserve a Table</Link>
        </div>
      </Reveal>
    </div>
  )
}