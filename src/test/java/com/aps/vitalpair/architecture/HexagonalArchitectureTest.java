package com.aps.vitalpair.architecture;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.classes;
import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

/**
 * Executable version of the layering rules in {@code docs/adr/0001-arquitetura-hexagonal.md}.
 *
 * <p>The rules held by convention alone until this class existed. Convention survives exactly
 * as long as everyone remembers it, which is why the one thing these tests protect is the
 * direction of dependencies: {@code infrastructure -> application -> domain}, never back.
 */
@AnalyzeClasses(packages = "com.aps.vitalpair", importOptions = ImportOption.DoNotIncludeTests.class)
class HexagonalArchitectureTest {

    /**
     * The domain is plain Java. The moment it imports a framework it stops being testable
     * without that framework, and the hexagon has collapsed.
     */
    @ArchTest
    static final ArchRule domain_depends_on_no_framework = noClasses()
            .that()
            .resideInAPackage("..domain..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage(
                    "org.springframework..",
                    "jakarta.persistence..",
                    "jakarta.validation..",
                    "com.fasterxml.jackson..",
                    "feign..")
            .because("the domain must stay framework-free so it can be tested and reasoned " + "about on its own");

    /** Application orchestrates use cases; it must not know how data arrives or is stored. */
    @ArchTest
    static final ArchRule application_does_not_depend_on_infrastructure = noClasses()
            .that()
            .resideInAPackage("..application..")
            .should()
            .dependOnClassesThat()
            .resideInAPackage("..infrastructure..")
            .because("application talks to the outside through ports, not adapters");

    /** A controller that reaches into persistence skips every rule the service enforces. */
    @ArchTest
    static final ArchRule web_does_not_depend_on_persistence = noClasses()
            .that()
            .resideInAPackage("..infrastructure.web..")
            .should()
            .dependOnClassesThat()
            .resideInAPackage("..infrastructure.persistence..")
            .because("controllers call use cases, never repositories directly");

    /** Keeps REST concerns in one place instead of leaking across the codebase. */
    @ArchTest
    static final ArchRule controllers_live_in_web_packages = classes()
            .that()
            .areAnnotatedWith(org.springframework.web.bind.annotation.RestController.class)
            .should()
            .resideInAPackage("..infrastructure.web..")
            .andShould()
            .haveSimpleNameEndingWith("Controller")
            .because("a controller outside the web layer hides an entry point into the system");

    /** Entities are a persistence detail and must not escape into the domain model. */
    @ArchTest
    static final ArchRule entities_live_in_persistence_packages = classes()
            .that()
            .areAnnotatedWith(jakarta.persistence.Entity.class)
            .should()
            .resideInAPackage("..infrastructure.persistence..")
            .because("JPA entities are an adapter concern, not the domain model");

    /**
     * Transactions belong to the use case, which knows what a complete unit of work is. On a
     * controller the boundary is the HTTP request; on a repository it is a single statement.
     */
    @ArchTest
    static final ArchRule transactions_are_declared_in_the_application_layer = noClasses()
            .that()
            .resideInAnyPackage("..infrastructure.web..", "..infrastructure.persistence..")
            .should()
            .beAnnotatedWith(org.springframework.transaction.annotation.Transactional.class)
            .because("the transaction boundary is the use case, not the endpoint or the query");

    /**
     * Console output cannot be filtered, routed or correlated once the app runs in a
     * container. Anything worth printing is worth logging through SLF4J.
     */
    @ArchTest
    static final ArchRule no_console_output = noClasses()
            .should()
            .accessField(System.class, "out")
            .orShould()
            .accessField(System.class, "err")
            .because("logging goes through SLF4J, which has levels and structure");

    /**
     * Features must not form dependency cycles. Two features that need each other are really
     * one feature, and neither can be changed or tested without the other.
     *
     * <p>Frozen on first run: existing cycles are recorded as the accepted baseline and any
     * new one fails the build. Shrink the baseline, never grow it.
     */
    @ArchTest
    static final ArchRule features_are_free_of_cycles = com.tngtech.archunit.library.freeze.FreezingArchRule.freeze(
            com.tngtech.archunit.library.dependencies.SlicesRuleDefinition.slices()
                    .matching("com.aps.vitalpair.(*)..")
                    .should()
                    .beFreeOfCycles());
}
