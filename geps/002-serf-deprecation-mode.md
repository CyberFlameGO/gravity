# GEP-002: Serf Deprecation Mode

<!-- toc -->
- [Summary](#summary)
- [Motivation](#motivation)
  - [Goals](#goals)
  - [Non-Goals](#non-goals)
- [Proposal](#proposal)
- [Design Details](#design-details)
- [Constraints and Conflict Resolution](#constraints-and-conflict-resolution)
  - [Test Plan](#test-plan)
<!-- /toc -->

## Summary

Gravity 7.x employs [serf](https://github.com/hashicorp/serf) as a cluster membership coordinator. Gravity 8.x removes
serf in favor of the k8s-based membership package. As no smooth transition had been
provided, upgrades of larger clusters that skip the worker nodes for efficiency, go through the state when members
report membership failures which can be cumbersome to deal with or even prevent the upgrdade from working.

## Motivation

In order to provide for smooth upgrades, serf infrastructure layer needs to be removed in a non-destructive way that
guarantees proper inter-cluster communication even during partial version bumps - e.g. when employing different
upgrade strategies for subsets of the clusters.

## Goals

Allow gradual rollout of newer versions for clusters based on Gravity 7.x.

## Proposal


### User Stories

#### Upgrade cluster as a whole

As a custer operator, I want to upgrade a 7.x cluster to a new version.

#### Upgrade cluster by upgrading masters only and rolling out workers using a different strategy

As a custer operator, I want to upgrade a 7.x cluster to a new version by upgrading master nodes first, and then gradually
roll out worker nodes by replacing each one with a new version in lock-step.


#### Upgrade cluster to both 8.x and 9.x (via 8.x)

As a cluster operator, I want to be able to upgrade a 7.x cluster to version 8.x and then to version 9.x


## Design Details

### Reintroduce Serf

To keep the inter-node status upgrades uninterrupted, 8.x upgrade will continue to bundle the serf binary and the corresponding
systemd service unit. The service unit will be conditionally enabled during upgrade but will not be used for new installations.

The planet environment configuration will include an environment variable `PLANET_UPGRADE_FROM` with the version
of the existing cluster. This detail will be additionally used to control the configurationo of the serf service.

The serf agent will be used to join the existing serf cluster but will otherwise not be used for any other purpose.

### Planet agent

New agent gRPC stratus attribute will be introduced to relay the version of the binary. This will usually coincide with the version of the cluster.

```proto
message NodeStatus {
  // ... existing fields
 
  // Version specifies the agent version.
  Version version = 5;
}

// Version describes the version of the agent
message Version {
    // Major specifies the major version component. E.g. 7 for 7.0.34
    int32 major = 1;
    // Minor specifies the minor version component. E.g. 0 for 7.0.34
    int32 minor = 2;
    // Patch specifies the patch version component. E.g. 34 for 7.0.34
    int32 patch = 3;
    // Prerelease specifies the pre-prelease metadata in free form
    string prerelease = 4;
}
```

The agent version might be used in the future to perform upgrade-specific customizations.

### Version Differentiation

An 8.x agent will be updated to dynamically discover the stable ID of the corresponding peer for internal management.

Currently, an 7.x agent uses <public ip>.<cluster-name> as the agent name while 8.x agent uses the node name
as configured in the kubelet while both agents have `publicip` and `role` metadata attached to their status heartbeats.
In order to deal with this incosistency, 8.x agents will use the `publicip` tag value as the common denominator for
computing overall agent status in its own status heartbeat.


## Constraints and Conflict Resolution

### Upgrade progressions

After upgrading a cluster to 8.x, the serf service will become redundant and even though it will incur small performance
overhead, the effects of this overhead are neglible and can be ignored.
After the cluster has been migrated to 9.x, the serf binary and the corresponding service will be finally removed.

As a performance optimization, new installations will have the service disabled.


### Test Plan

Following test scenarios will need to be verified:

 - New installation of 8.x
 - Upgrading an 7.x cluster
 - Upgrading an 7.x cluster with workers skipped and workers rolled out separately
 - Upgrading an 7.x cluster to 9.x via 8.x
 - Upgrading an 7.x cluster to 9.x via 8.x with workers skipped and workers rolled out separately
