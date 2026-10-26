/* CONVITE — ALANA 19 */

const CONFIG = {
    SHEETS_URL: "https://script.google.com/macros/s/AKfycbzHBsqtEphQOgcTPlGJyX2KX_EdrZVTfIi5yJ6MR7oo1VBgm6b5613O5axV7G9QS9ur/exec",

    MAX_COMPANIONS: 4,

    MESSAGES: {
        yes: "Eba! Aguardo você!",
        no: "Aw :c resposta enviada com sucesso",
        error: "Não foi possível enviar sua resposta. Tente novamente."
    }
};

/* ELEMENTOS */

const intro = document.querySelector("#intro");
const envelope = document.querySelector("#open-envelope");
const invitation = document.querySelector("#invitation");
const particles = document.querySelector("#particles");

const envelopeStage = document.querySelector(".envelope__stage");
const envelopeFlap = document.querySelector(".envelope__flap-hinge");

const envelopeLetter = document.querySelector(
    ".envelope__letter-track"
);

const envelopeLetterVisible = document.querySelector(
    ".envelope__letter-visible-track"
);

const form = document.querySelector("#rsvp-form");
const guestName = document.querySelector("#guest-name");
const companions = document.querySelector("#companions");
const companionsField = document.querySelector("#companions-field");
const feedback = document.querySelector("#rsvp-feedback");
const submitButton = document.querySelector("#rsvp-submit");

const attendanceOptions = document.querySelectorAll(
    'input[name="presenca"]'
);

const motionQuery = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
);

/* ANIMAÇÃO DO ENVELOPE */

let envelopeOpened = false;

function showInvitation() {
    if (intro) {
        intro.hidden = true;
    }

    if (invitation) {
        invitation.hidden = false;
        invitation.classList.add("is-visible");
    }

    if (envelope) {
        envelope.setAttribute("aria-expanded", "true");
    }

    window.scrollTo({
        top: 0,
        behavior: "instant"
    });
}

function createParticles() {
    if (!particles || motionQuery.matches) {
        return;
    }

    particles.replaceChildren();

    const particleCount = 18;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement("span");

        particle.classList.add("particle");

        particle.classList.add(
            Math.random() > 0.5
                ? "particle--red"
                : "particle--silver"
        );

        particle.style.setProperty(
            "--particle-x",
            `${Math.random() * 100}%`
        );

        particle.style.setProperty(
            "--particle-delay",
            `${Math.random() * 0.4}s`
        );

        particle.style.setProperty(
            "--particle-duration",
            `${0.9 + Math.random() * 0.8}s`
        );

        particles.appendChild(particle);
    }
}

function openEnvelope() {
    if (envelopeOpened) {
        return;
    }

    envelopeOpened = true;

    if (!envelope || !intro || !invitation) {
        showInvitation();
        return;
    }

    const reducedMotion = motionQuery.matches;

    const timings = reducedMotion
        ? {
            flap: 90,
            letter: 310,
            finish: 780
        }
        : {
            flap: 220,
            letter: 760,
            finish: 1550
        };

    envelope.classList.add("is-opening");
    intro.classList.add("is-opening");

    envelopeStage?.classList.add("is-seal-released");

    if (!reducedMotion) {
        createParticles();
    }

    // A aba abre após a saída do selo.

    window.setTimeout(() => {
        envelopeFlap?.classList.add("is-flap-open");
    }, timings.flap);

    // As duas renderizações do papel sobem juntas.

    window.setTimeout(() => {
        envelopeLetter?.classList.add("is-letter-revealed");

        envelopeLetterVisible?.classList.add(
            "is-letter-revealed"
        );
    }, timings.letter);

    window.setTimeout(() => {
        showInvitation();
    }, timings.finish);
}

envelope?.addEventListener("click", openEnvelope);

/* CONFIRMAÇÃO DE PRESENÇA */

function getAttendance() {
    return document.querySelector(
        'input[name="presenca"]:checked'
    )?.value ?? "";
}

function clearFeedback() {
    if (!feedback) {
        return;
    }

    feedback.textContent = "";
    delete feedback.dataset.state;
}

function showFeedback(message, state) {
    if (!feedback) {
        return;
    }

    feedback.textContent = message;
    feedback.dataset.state = state;
}

function updateCompanionsField() {
    if (!companions) {
        return;
    }

    const attending = getAttendance() === "Sim";

    companions.disabled = !attending;
    companions.required = attending;

    if (companionsField) {
        companionsField.hidden = !attending;
    }

    if (!attending) {
        companions.value = "";
        companions.setCustomValidity("");
    }

    clearFeedback();
}

attendanceOptions.forEach((option) => {
    option.addEventListener("change", updateCompanionsField);
});

guestName?.addEventListener("input", () => {
    guestName.setCustomValidity("");
    clearFeedback();
});

companions?.addEventListener("input", () => {
    companions.setCustomValidity("");
    clearFeedback();
});

/* VALIDAÇÃO */

function validateCompanions() {
    if (getAttendance() !== "Sim") {
        return true;
    }

    if (!companions) {
        return false;
    }

    const rawValue = companions.value.trim();
    const quantity = Number(rawValue);

    const valid =
        rawValue !== "" &&
        Number.isInteger(quantity) &&
        quantity >= 0 &&
        quantity <= CONFIG.MAX_COMPANIONS;

    companions.setCustomValidity(
        valid
            ? ""
            : "Informe um número inteiro de 0 a 4."
    );

    if (!valid) {
        companions.reportValidity();
    }

    return valid;
}

/* ENVIO PARA O GOOGLE SHEETS */

let sending = false;

form?.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (sending || !guestName || !submitButton) {
        return;
    }

    clearFeedback();

    const name = guestName.value.trim();
    const attendance = getAttendance();

    if (!name) {
        guestName.setCustomValidity(
            "Informe seu nome para continuar."
        );

        guestName.reportValidity();
        return;
    }

    guestName.setCustomValidity("");

    if (!attendance) {
        showFeedback(
            "Selecione uma opção de presença.",
            "error"
        );

        return;
    }

    if (!validateCompanions()) {
        return;
    }

    const body = new URLSearchParams({
        nome: name,
        presenca: attendance,
        acompanhantes:
            attendance === "Sim"
                ? companions.value
                : ""
    });

    sending = true;
    submitButton.disabled = true;

    const originalLabel = submitButton.textContent;
    submitButton.textContent = "Enviando...";

    try {
        await fetch(CONFIG.SHEETS_URL, {
            method: "POST",
            mode: "no-cors",
            body
        });

        form.reset();
        updateCompanionsField();

        showFeedback(
            attendance === "Sim"
                ? CONFIG.MESSAGES.yes
                : CONFIG.MESSAGES.no,
            "success"
        );

    } catch (error) {
        console.error(
            "Erro ao enviar a confirmação:",
            error
        );

        showFeedback(
            CONFIG.MESSAGES.error,
            "error"
        );

    } finally {
        sending = false;
        submitButton.disabled = false;
        submitButton.textContent = originalLabel;
    }
});

/* ESTADO INICIAL */

updateCompanionsField();